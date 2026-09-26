"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h1>
      <p className="text-gray-500 text-sm font-mono bg-gray-100 px-3 py-2 rounded max-w-lg mb-6">
        {error.message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm"
        >
          Retry
        </button>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 px-5 py-2">
          Go home
        </Link>
      </div>
    </div>
  );
}
