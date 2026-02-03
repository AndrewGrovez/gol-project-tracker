"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Something went wrong
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          We hit an unexpected error.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Try again, or refresh the page if the problem persists.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[#1c3145] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#223d58]"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Reload
          </button>
        </div>
        {error?.digest ? (
          <p className="mt-6 text-xs text-slate-400">Error ID: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
