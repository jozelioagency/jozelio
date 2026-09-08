"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/actions";
import { CheckCircle, XCircle, Loader2, LogIn } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "success"; tenantId: string }
  | { status: "alreadyAccepted" }
  | { status: "wrongAccount"; email: string }
  | { status: "requiresAuth"; email?: string }
  | { status: "error"; message: string };

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "No invitation token found in this link." });
      return;
    }

    acceptInvitation(token).then((res) => {
      if (res.success && res.tenantId) {
        setState({ status: "success", tenantId: res.tenantId });
      } else if (res.requiresAuth) {
        setState({ status: "requiresAuth", email: res.email });
      } else if (res.alreadyAccepted) {
        setState({ status: "alreadyAccepted" });
      } else if (res.wrongAccount) {
        setState({ status: "wrongAccount", email: res.error?.match(/to (.+)\./)?.[1] ?? "" });
      } else {
        setState({ status: "error", message: res.error ?? "Something went wrong." });
      }
    });
  }, [token]);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >

      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#113669",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "#FF6B00",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 20,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            J
          </div>
          <span
            style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}
          >
            <span style={{ color: "#FF6B00" }}>Jo</span>zelio
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 32 }}>
          {state.status === "loading" && (
            <div style={{ textAlign: "center", color: "#8b949e" }}>
              <Loader2
                style={{ width: 40, height: 40, color: "#FF6B00", marginBottom: 16, animation: "spin 1s linear infinite" }}
              />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3" }}>
                Verifying your invitation…
              </p>
              <p style={{ fontSize: 13, marginTop: 8 }}>
                Please wait while we validate your invite link.
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {state.status === "success" && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle style={{ width: 48, height: 48, color: "#3fb950", margin: "0 auto 16px" }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8 }}>
                Invitation accepted!
              </h1>
              <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 28, lineHeight: 1.6 }}>
                You&apos;ve successfully joined the project workspace. Head to your dashboard to get started.
              </p>
              <button
                onClick={() => router.push(`/project/${state.tenantId}/bocado/menu`)}
                style={{
                  display: "inline-block",
                  background: "#FF6B00",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Go to Project Dashboard →
              </button>
            </div>
          )}

          {state.status === "alreadyAccepted" && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle style={{ width: 48, height: 48, color: "#3fb950", margin: "0 auto 16px" }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8 }}>
                Already a member
              </h1>
              <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 28, lineHeight: 1.6 }}>
                This invitation has already been accepted. Head to your dashboard to access the project.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  display: "inline-block",
                  background: "#113669",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Go to Dashboard →
              </button>
            </div>
          )}

          {state.status === "requiresAuth" && (
            <div style={{ textAlign: "center" }}>
              <LogIn style={{ width: 48, height: 48, color: "#FF6B00", margin: "0 auto 16px" }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8 }}>
                Sign In Required
              </h1>
              <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 28, lineHeight: 1.6 }}>
                Please sign in or create an account to accept this invitation.
                {state.email && (
                  <>
                    {" "}This invitation was sent to{" "}
                    <strong style={{ color: "#FF6B00" }}>{state.email}</strong>.
                  </>
                )}
              </p>
              <button
                onClick={() => router.push("/?mode=signin")}
                style={{
                  display: "inline-block",
                  background: "#FF6B00",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Sign In to Accept →
              </button>
            </div>
          )}

          {state.status === "wrongAccount" && (
            <div style={{ textAlign: "center" }}>
              <LogIn style={{ width: 48, height: 48, color: "#FF6B00", margin: "0 auto 16px" }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8 }}>
                Wrong account
              </h1>
              <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 28, lineHeight: 1.6 }}>
                This invitation was sent to a different email address.
                {state.email && (
                  <>
                    {" "}Please sign in with{" "}
                    <strong style={{ color: "#FF6B00" }}>{state.email}</strong> to accept it.
                  </>
                )}
              </p>
              <button
                onClick={() => router.push("/?mode=signin")}
                style={{
                  display: "inline-block",
                  background: "#FF6B00",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Sign in with correct account →
              </button>
            </div>
          )}

          {state.status === "error" && (
            <div style={{ textAlign: "center" }}>
              <XCircle style={{ width: 48, height: 48, color: "#f85149", margin: "0 auto 16px" }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8 }}>
                Invitation error
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "#8b949e",
                  marginBottom: 28,
                  lineHeight: 1.6,
                  background: "#0d1117",
                  border: "1px solid #f8514933",
                  borderRadius: 6,
                  padding: "12px 16px",
                  textAlign: "left",
                }}
              >
                {state.message}
              </p>
              <button
                onClick={() => router.push("/")}
                style={{
                  display: "inline-block",
                  background: "#21262d",
                  color: "#e6edf3",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#0d1117",
            borderTop: "1px solid #30363d",
            padding: "16px 32px",
            textAlign: "center",
            fontSize: 11,
            color: "#484f58",
          }}
        >
          © {new Date().getFullYear()} Jozelio. All rights reserved.
        </div>
      </div>
    </div>
  );
}
