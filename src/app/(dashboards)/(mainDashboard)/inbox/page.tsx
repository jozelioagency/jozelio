import React from "react";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { getPendingInvitations, getSystemNotifications } from "@/app/actions";
import InboxClient from "./InboxClient";


export default async function InboxPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const invitations = await getPendingInvitations();
  const notifications = await getSystemNotifications();

  return (
    <InboxClient 
      initialInvitations={invitations as any} 
      initialNotifications={notifications as any} 
      user={{
        name: session.user.name || session.user.username || "User",
        email: session.user.email
      }}
    />
  );
}
