"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="text-rose-500" size={28} fill="currentColor" />
          <span className="text-2xl font-bold text-gray-900">Not Alone</span>
        </Link>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100/60 p-8 text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-rose-500" size={26} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 mb-1">We sent a password reset link to</p>
            <p className="font-semibold text-gray-900 mb-4">{email}</p>
            <p className="text-gray-500 text-sm mb-6">
              Click the link in that email to set a new password.
              <br />
              Check your spam folder if it doesn&apos;t arrive within a minute.
            </p>
            <Link
              href="/login"
              className="text-sm text-violet-600 hover:underline flex items-center justify-center gap-1"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100/60 p-8">
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-500 mb-6">
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
