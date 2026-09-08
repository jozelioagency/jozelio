"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Super Admin Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full border-4 border-brand-blue bg-brand-white shadow-[8px_8px_0px_#113669] p-8 text-center">
        <div className="w-14 h-14 bg-red-600 text-white border-3 border-brand-blue flex items-center justify-center mx-auto mb-5 shadow-[3px_3px_0px_#113669]">
          <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
        </div>

        <h1 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight mb-2">
          Admin Panel Error
        </h1>
        <p className="text-sm text-brand-blue/70 font-semibold mb-6">
          An unexpected error occurred in the admin panel. This has been logged for review.
        </p>
        {error.digest && (
          <div className="w-full bg-brand-grey/25 border-2 border-brand-blue/30 p-2.5 mb-6 font-mono text-[10px] text-brand-blue/70 truncate">
            ERROR_DIGEST: {error.digest}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={reset}
            className="flex-1 h-12 bg-brand-blue hover:bg-brand-orange text-brand-white font-mono text-xs font-black uppercase tracking-wider border-2 border-brand-blue transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            href="/dashboard"
            className="flex-1 h-12 bg-brand-grey hover:bg-brand-blue text-brand-blue hover:text-brand-white font-mono text-xs font-black uppercase tracking-wider border-2 border-brand-blue transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
