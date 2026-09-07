"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root Error Boundary Catch]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-brand-blue font-sans select-none">
      <div className="max-w-md w-full bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#113669] p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-brand-orange text-brand-white border-3 border-brand-blue flex items-center justify-center mb-6 shadow-[3px_3px_0px_#113669]">
          <AlertOctagon className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h1 className="font-mono text-2xl font-black uppercase tracking-tight mb-2">
          System Interrupted
        </h1>
        <p className="text-sm font-semibold text-brand-blue/80 mb-6 leading-relaxed">
          An unexpected error occurred while processing your request. Please try resetting the view or return to safety.
        </p>

        {error?.digest && (
          <div className="w-full bg-brand-grey/25 border-2 border-brand-blue/30 p-2.5 mb-6 font-mono text-[10px] text-brand-blue/70 truncate">
            ERROR_DIGEST: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 h-12 bg-brand-orange hover:bg-brand-blue text-brand-white hover:text-brand-white font-mono text-xs font-black uppercase tracking-wider border-2 border-brand-blue transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="flex-1 h-12 bg-brand-grey hover:bg-brand-blue text-brand-blue hover:text-brand-white font-mono text-xs font-black uppercase tracking-wider border-2 border-brand-blue transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
