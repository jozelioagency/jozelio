import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";
import { cookies } from "next/headers";

export const runtime = "edge";

export default async function OnboardingPage() {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  // 2. If they already have a username, bypass onboarding completely
  if (session.user.username) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  // 3. Render the onboarding profile completion form
  return (
    <OnboardingClient 
      userEmail={session.user.email} 
      initialName={session.user.name} 
      initialImage={session.user.image || null} 
      lang={savedLang}
    />
  );
}
