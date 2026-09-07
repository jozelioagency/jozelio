"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Project Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full border-4 border-brand-blue bg-brand-white shadow-[8px_8px_0px_#113669] p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-brand-orange mx-auto mb-4" />
        <h1 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight mb-2">
          Project Error
        </h1>
        <p className="text-sm text-brand-blue/70 font-semibold mb-6">
          {error.message || "An unexpected error occurred in this project. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-brand-blue/40 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-brand-blue text-brand-white font-bold text-sm px-5 py-3 border-2 border-brand-blue shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-brand-white text-brand-blue font-bold text-sm px-5 py-3 border-2 border-brand-blue shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
