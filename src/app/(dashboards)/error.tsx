"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full border-4 border-brand-blue bg-brand-white shadow-[8px_8px_0px_#113669] p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-brand-orange mx-auto mb-4" />
        <h1 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-brand-blue/70 font-semibold mb-6">
          {error.message || "An unexpected error occurred in the dashboard. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-brand-blue/40 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-brand-blue text-brand-white font-bold text-sm px-6 py-3 border-2 border-brand-blue shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
