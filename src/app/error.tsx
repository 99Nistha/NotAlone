"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-1 text-sm font-mono bg-gray-100 px-3 py-2 rounded max-w-lg">
        {error.message}
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={reset}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2 rounded-lg text-sm"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-5 py-2 rounded-lg text-sm"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
