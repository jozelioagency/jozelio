"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, count, and, ne, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { invitationEmailHtml, systemNoticeEmail } from "@/lib/email-templates";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { handleActionError, validateLength, MAX_LENGTHS } from "./_shared";
import { getEnv } from "@/lib/get-env";



const RESERVED_SUBDOMAINS = ["www", "api", "admin", "jozelio", "portal", "media", "auth", "static", "assets"];
import { checkUserProjectPermission } from "./tenant-actions";


/**
 * Server action to invite a team member to a project.
 * Generates a secure token, persists it, and fires a branded invitation
 * email via Resend that contains a one-click accept link.
 */
export async function inviteTeamMember(data: {
  tenantId: string;
  emailOrUsername: string;
  role: "admin" | "manager" | "viewer";
}) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const tenant = await checkUserProjectPermission(db, data.tenantId, session.user.id, ["owner", "admin"]);
    if (!tenant) {
      return { error: "Unauthorized to invite team members" };
    }

    const cleanInput = data.emailOrUsername.trim().toLowerCase();
    if (!cleanInput) {
      return { error: "Invitation identifier cannot be empty" };
    }

    let targetEmail = cleanInput;
    let targetUserId: string | null = null;

    // Check if input is an email (contains @) or a username
    if (cleanInput.includes("@")) {
      const foundUser = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, cleanInput))
        .get();
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    } else {
      const foundUser = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.username, cleanInput))
        .get();
      if (!foundUser) {
        return { error: `No user found with the username "${data.emailOrUsername}"` };
      }
      targetEmail = foundUser.email;
      targetUserId = foundUser.id;
    }

    // Prevent inviting self
    if (
      targetEmail.toLowerCase() === session.user.email.trim().toLowerCase() ||
      (targetUserId && targetUserId === session.user.id)
    ) {
      return { error: "Security validation: You cannot invite yourself to your own project workspace" };
    }

    // Check if already invited or member
    const existing = await db
      .select()
      .from(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.tenantId, data.tenantId),
          eq(schema.tenantMembers.email, targetEmail)
        )
      )
      .get();

    if (existing) {
      return { error: "User is already invited or a member" };
    }

    // ── Generate a cryptographically secure invite token (72-hour expiry) ──
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const inviteToken = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // Persist invitation with token
    await db.insert(schema.tenantMembers).values({
      tenantId: data.tenantId,
      email: targetEmail,
      role: data.role,
      status: "pending",
      userId: targetUserId,
      inviteToken,
      inviteExpiresAt,
    });

    // ── Send invitation email via Resend (fire-and-forget) ────────────────
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "jozelio.dev:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const acceptUrl = `${protocol}://${appDomain}/invite/accept?token=${inviteToken}`;
    const fromEmail = process.env.RESEND_WORKSPACES_EMAIL || "Jozelio Workspaces <workspaces@mail.jozelio.com>";
    const inviterName = session.user.name || session.user.email;
    const roleLabelMap: Record<string, string> = {
      admin: "Admin",
      manager: "Manager",
      viewer: "Viewer",
    };
    const roleLabel = roleLabelMap[data.role] ?? data.role;

    const htmlBody = invitationEmailHtml({
      inviterName,
      businessName: tenant.businessName,
      roleLabel,
      acceptUrl,
    });

    void new Resend(process.env.RESEND_API_KEY)
      .emails.send({
        from: fromEmail,
        to: targetEmail,
        subject: `You're invited to join "${tenant.businessName}" on Jozelio`,
        html: htmlBody,
      })
      .catch((err: unknown) => {
        console.error("[Jozelio/Resend] Invitation email failed:", err);
      });

    return { success: true, resolvedEmail: targetEmail };
  } catch (error: any) {
    return { error: error?.message || "Failed to send invitation" };
  }
}

/**
 * Server action to accept a project invitation via the emailed token link.
 * Called by the /invite/accept page route.
 */
export async function acceptInvitation(token: string) {
  try {
    if (!token || token.length < 32) {
      return { error: "Invalid or missing invitation token" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // Look up invitation row by token
    const invite = await db
      .select()
      .from(schema.tenantMembers)
      .where(eq(schema.tenantMembers.inviteToken, token))
      .get();

    if (!invite) {
      return { error: "Invitation not found. It may have already been accepted or revoked." };
    }

    if (invite.status === "accepted") {
      return { alreadyAccepted: true };
    }

    if (invite.inviteExpiresAt && invite.inviteExpiresAt < new Date()) {
      return { error: "This invitation link has expired. Please ask the workspace owner to send a new one." };
    }

    // Must be logged in to accept an invitation
    const session = await getSession();
    if (!session) {
      return {
        requiresAuth: true,
        email: invite.email,
        error: "Please sign in or create an account to accept this workspace invitation.",
      };
    }

    // If logged-in user's email doesn't match the invite target, refuse
    if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return {
        error: `This invitation was sent to ${invite.email}. Please sign in with that email address to accept it.`,
        wrongAccount: true,
      };
    }

    const resolvedUserId = session.user.id;

    // Mark invite accepted and clear the token
    await db
      .update(schema.tenantMembers)
      .set({
        status: "accepted",
        userId: resolvedUserId,
        inviteToken: null,
        inviteExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.tenantMembers.id, invite.id))
      .run();

    revalidatePath(`/project/${invite.tenantId}/bocado/settings`);
    return { success: true, tenantId: invite.tenantId };
  } catch (error: any) {
    console.error("acceptInvitation error:", error);
    return { error: error?.message || "Failed to accept invitation" };
  }
}

/**
 * Server action to remove a team member or cancel an invitation.
 */
export async function removeTeamMember(tenantId: string, memberId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const tenant = await checkUserProjectPermission(db, tenantId, session.user.id, ["owner", "admin"]);
    if (!tenant) {
      return { error: "Unauthorized to remove team members" };
    }

    // Retrieve target member to verify their role
    const targetMember = await db
      .select()
      .from(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.id, memberId),
          eq(schema.tenantMembers.tenantId, tenantId)
        )
      )
      .get();

    if (!targetMember) {
      return { error: "Member not found" };
    }

    const isOwner = tenant.userId === session.user.id;

    if (!isOwner) {
      // Caller is an admin member. Verify caller role and enforce hierarchy.
      const callerMember = await db
        .select()
        .from(schema.tenantMembers)
        .where(
          and(
            eq(schema.tenantMembers.tenantId, tenantId),
            eq(schema.tenantMembers.userId, session.user.id),
            eq(schema.tenantMembers.status, "accepted")
          )
        )
        .get();

      if (!callerMember || callerMember.role !== "admin") {
        return { error: "Unauthorized to remove team members" };
      }

      // Security validation: Admin cannot remove other admins or the project owner
      if (targetMember.role === "admin" || targetMember.userId === tenant.userId) {
        return { error: "Security protection: Admins cannot remove other admin members or the project owner." };
      }
    }

    await db
      .delete(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.id, memberId),
          eq(schema.tenantMembers.tenantId, tenantId)
        )
      )
      .run();

    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to remove team member" };
  }
}

/**
 * Server action for a collaborator to leave a shared project.
 */
export async function leaveProject(tenantId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // Ensure the project exists
    const project = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .get();

    if (!project) {
      return { error: "Project not found" };
    }

    // Owners cannot leave their own project
    if (project.userId === session.user.id) {
      return { error: "Project owners cannot leave their own workspace. You must transfer ownership or delete the project instead." };
    }

    // Delete membership record matching the user's ID
    await db
      .delete(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.tenantId, tenantId),
          eq(schema.tenantMembers.userId, session.user.id)
        )
      )
      .run();

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to leave project" };
  }
}

/**
 * Server action to accept or decline a project invitation.
 */
export async function respondToInvitation(invitationId: string, action: "accept" | "decline") {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const invitation = await db
      .select()
      .from(schema.tenantMembers)
      .where(eq(schema.tenantMembers.id, invitationId))
      .get();

    if (!invitation) return { error: "Invitation not found" };

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return { error: "This invitation is not addressed to you" };
    }

    if (action === "accept") {
      await db
        .update(schema.tenantMembers)
        .set({
          status: "accepted",
          userId: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.tenantMembers.id, invitationId))
        .run();
    } else {
      await db
        .delete(schema.tenantMembers)
        .where(eq(schema.tenantMembers.id, invitationId))
        .run();
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to process invitation" };
  }
}

/**
 * Server action to retrieve all pending invitations for the logged-in user.
 */
export async function getPendingInvitations() {
  try {
    const session = await getSession();
    if (!session) return [];

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const cleanEmail = session.user.email.toLowerCase();

    const list = await db
      .select({
        id: schema.tenantMembers.id,
        role: schema.tenantMembers.role,
        businessName: schema.tenants.businessName,
        tenantId: schema.tenants.id,
      })
      .from(schema.tenantMembers)
      .innerJoin(schema.tenants, eq(schema.tenantMembers.tenantId, schema.tenants.id))
      .where(
        and(
          eq(schema.tenantMembers.email, cleanEmail),
          eq(schema.tenantMembers.status, "pending")
        )
      )
      .all();

    return list;
  } catch (error) {
    console.error("getPendingInvitations error:", error);
    return [];
  }
}

/**
 * Server action to retrieve all active/pending members for a specific tenant.
 */
export async function getTenantMembers(tenantId: string) {
  try {
    const session = await getSession();
    if (!session) return [];

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const list = await db
      .select()
      .from(schema.tenantMembers)
      .where(eq(schema.tenantMembers.tenantId, tenantId))
      .all();

    return list;
  } catch (error) {
    console.error("getTenantMembers error:", error);
    return [];
  }
}

