/**
 * Jozelio Branded Email Templates
 *
 * Matches the main website's brutalist design system:
 * - Background:  #eaeaea (warm light grey)
 * - Primary:     #113669 (deep navy blue)
 * - Accent:      #f58a2d (warm orange)
 * - White:       #ffffff
 * - Typography:  Space Grotesk (display), Inter (body), JetBrains Mono (mono)
 * - Style:       Brutalist — sharp corners, thick borders, bold offset shadows
 *
 * Logo: Uses /branding/mail-logo.png hosted on the app domain.
 */

const isProd = process.env.NODE_ENV === "production";
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || (isProd ? "jozelio.com" : "jozelio.dev:3000");
const PROTOCOL = isProd ? "https" : "http";
const LOGO_URL = `${PROTOCOL}://${APP_DOMAIN}/branding/mail-logo.png`;

// ─── Brand Tokens (mirroring globals.css @theme) ──────────────
const B = {
  navy: "#113669",
  orange: "#f58a2d",
  bg: "#eaeaea",
  white: "#ffffff",
  grey: "#d4d4d4",
  textMuted: "#5a6f8a",
  shadowOffset: "4px 4px 0px #113669",
  shadowOffsetSm: "2px 2px 0px #113669",
} as const;

// ─── Shared Wrapper ───────────────────────────────────────────

export function wrapEmail(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background:${B.bg}; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:${B.navy};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${B.bg}; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:${B.white}; border:2px solid ${B.navy}; box-shadow:${B.shadowOffset};">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:${B.white}; padding:24px 32px; border-bottom:2px solid ${B.navy};">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:16px; vertical-align:middle;">
                    <img src="${LOGO_URL}" alt="Jozelio" width="48" height="48" style="display:block; width:48px; height:48px; border:2px solid ${B.navy}; box-shadow:${B.shadowOffsetSm};" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:'Space Grotesk','Inter',sans-serif; font-size:22px; font-weight:900; color:${B.navy}; letter-spacing:-0.5px; text-transform:uppercase;">
                      <span style="color:${B.orange};">JO</span>ZELIO
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:${B.navy}; padding:20px 32px; border-top:2px solid ${B.navy};">
              <p style="margin:0; font-family:'JetBrains Mono','Courier New',monospace; font-size:9px; color:${B.white}; letter-spacing:1.5px; text-transform:uppercase; text-align:center; opacity:0.7;">
                © ${new Date().getFullYear()} Jozelio · Universal Business Engine
              </p>
              <p style="margin:6px 0 0; font-size:10px; color:${B.white}; text-align:center; opacity:0.5;">
                You received this because an action was taken on your Jozelio account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared UI Primitives ─────────────────────────────────────

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
  <tr>
    <td style="background:${B.orange}; border:2px solid ${B.navy}; box-shadow:${B.shadowOffsetSm};">
      <a href="${url}" style="display:inline-block; padding:14px 32px; font-family:'Space Grotesk','Inter',sans-serif; font-size:12px; font-weight:900; color:${B.white}; text-decoration:none; letter-spacing:1.5px; text-transform:uppercase;">${text}</a>
    </td>
  </tr>
</table>`;
}

function divider(): string {
  return `<hr style="border:none; border-top:2px solid ${B.bg}; margin:24px 0;" />`;
}

function greeting(text: string): string {
  return `<p style="font-family:'Space Grotesk','Inter',sans-serif; font-size:17px; font-weight:800; color:${B.navy}; margin:0 0 12px; text-transform:uppercase; letter-spacing:-0.3px;">${text}</p>`;
}

function description(text: string): string {
  return `<p style="font-size:14px; color:${B.textMuted}; line-height:1.7; margin:0 0 24px; font-weight:500;">${text}</p>`;
}

function fallbackUrl(url: string): string {
  return `<p style="font-size:11px; color:${B.textMuted}; word-break:break-all; margin:0;">
  If the button doesn't work, copy and paste this link:<br />
  <a href="${url}" style="color:${B.orange}; font-weight:600;">${url}</a>
</p>`;
}

function smallNote(text: string): string {
  return `<p style="font-size:11px; color:${B.textMuted}; margin:12px 0 0; font-style:italic;">${text}</p>`;
}

// ─── Email Templates ──────────────────────────────────────────

export function verificationEmailHtml(name: string, url: string): string {
  return wrapEmail(
    `${greeting(`Hi ${name || "there"} 👋`)}
    ${description("Thanks for joining Jozelio! Please verify your email address to activate your account and unlock your universal dashboard.")}
    <div style="text-align:center;">
      ${ctaButton("✓ Verify My Email", url)}
    </div>
    ${divider()}
    ${fallbackUrl(url)}`,
    "Verify your Jozelio email"
  );
}

export function resetPasswordEmailHtml(name: string, url: string): string {
  return wrapEmail(
    `${greeting(`Hi ${name || "there"}`)}
    ${description(`We received a request to reset the password for your Jozelio account. Click the button below to choose a new password. This link expires in <strong style="color:${B.orange};">1 hour</strong>.`)}
    <div style="text-align:center;">
      ${ctaButton("🔑 Reset My Password", url)}
    </div>
    ${divider()}
    ${description("If you did not request a password reset, you can safely ignore this email — your account is still secure.")}
    ${fallbackUrl(url)}`,
    "Reset your Jozelio password"
  );
}

export type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

export function otpEmailHtml(otp: string, type: OtpType): string {
  const subjectMap: Record<OtpType, string> = {
    "sign-in": "Your sign-in code",
    "email-verification": "Your email verification code",
    "forget-password": "Your password reset code",
    "change-email": "Your email change code",
  };

  const descMap: Record<OtpType, string> = {
    "sign-in": "Use this one-time code to sign in to your Jozelio account.",
    "email-verification": "Use this one-time code to verify your email address on Jozelio.",
    "forget-password": "Use this one-time code to reset your Jozelio password.",
    "change-email": "Use this one-time code to confirm your new email address on Jozelio.",
  };

  const subject = subjectMap[type];

  return wrapEmail(
    `${greeting(subject)}
    ${description(`${descMap[type]} It expires in <strong style="color:${B.orange};">10 minutes</strong>.`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px; background:${B.bg}; border:2px dashed ${B.orange}; box-shadow:${B.shadowOffsetSm};">
      <tr>
        <td style="padding:20px 36px; text-align:center;">
          <p style="font-family:'JetBrains Mono','Courier New',monospace; font-size:36px; font-weight:900; color:${B.orange}; letter-spacing:12px; margin:0;">${otp}</p>
          <p style="font-family:'JetBrains Mono','Courier New',monospace; font-size:9px; color:${B.textMuted}; letter-spacing:2px; text-transform:uppercase; margin:8px 0 0;">One-time code · Valid for 10 minutes</p>
        </td>
      </tr>
    </table>
    ${smallNote("Never share this code with anyone. Jozelio staff will never ask for it.")}`,
    `Jozelio – ${subject}`
  );
}

export function invitationEmailHtml(opts: {
  inviterName: string;
  businessName: string;
  roleLabel: string;
  acceptUrl: string;
}): string {
  return wrapEmail(
    `${greeting("You've been invited! 🎉")}
    ${description(`<strong style="color:${B.navy};">${opts.inviterName}</strong> has invited you to collaborate on a Jozelio project workspace.`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin:0 0 28px; background:${B.bg}; border:2px solid ${B.navy}; border-left:4px solid ${B.orange}; box-shadow:${B.shadowOffsetSm};">
      <tr>
        <td style="padding:16px 20px;">
          <p style="font-family:'Space Grotesk','Inter',sans-serif; font-size:17px; font-weight:800; color:${B.navy}; margin:0; text-transform:uppercase; letter-spacing:-0.3px;">${opts.businessName}</p>
          <p style="font-family:'JetBrains Mono','Courier New',monospace; font-size:10px; font-weight:700; color:${B.orange}; text-transform:uppercase; letter-spacing:1.5px; margin:4px 0 0;">${opts.roleLabel} access</p>
        </td>
      </tr>
    </table>
    <div style="text-align:center;">
      ${ctaButton("✓ Accept Invitation", opts.acceptUrl)}
    </div>
    ${divider()}
    ${fallbackUrl(opts.acceptUrl)}
    ${smallNote("This invitation link expires in 72 hours.")}`,
    `You're invited to join ${opts.businessName} on Jozelio`
  );
}

export function systemNoticeEmail(title: string, message: string): string {
  return wrapEmail(
    `${greeting(title)}
    ${description(message)}
    ${divider()}
    ${smallNote("If you believe this is a mistake, please contact Jozelio support.")}`,
    `Jozelio – ${title}`
  );
}
