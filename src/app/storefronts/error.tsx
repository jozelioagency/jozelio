"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Storefront Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-brand-blue font-sans select-none">
      <div className="max-w-sm w-full bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#f58a2d] p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-brand-orange text-brand-white border-3 border-brand-blue flex items-center justify-center mb-5 shadow-[3px_3px_0px_#113669]">
          <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
        </div>

        <h1 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-brand-blue/70 font-semibold mb-6 leading-relaxed">
          We couldn&apos;t load this page. Please try again — if the problem continues, the store may be temporarily unavailable.
        </p>

        <button
          onClick={reset}
          className="w-full h-12 bg-brand-orange hover:bg-brand-blue text-brand-white font-mono text-xs font-black uppercase tracking-wider border-2 border-brand-blue transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
