"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    });

    if (!signUpError && form.phone) {
      await supabase
        .from("profiles")
        .update({ phone: form.phone })
        .eq("id", data.user?.id ?? "");
    }

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Session present immediately → email confirmation is OFF → go straight in
    if (data.session) {
      router.push("/onboarding");
      return;
    }

    // No session → email confirmation is ON → show check-your-email screen
    setConfirmationSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="text-rose-500" size={28} fill="currentColor" />
          <span className="text-2xl font-bold text-gray-900">Not Alone</span>
        </Link>

        {confirmationSent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100/60 p-8 text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-rose-500" size={28} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 mb-2">We sent a confirmation link to</p>
            <p className="font-semibold text-gray-900 mb-4">{form.email}</p>
            <p className="text-gray-500 text-sm">
              Click the link in that email to activate your account, then{" "}
              <Link href="/login" className="text-violet-600 hover:underline">
                log in here
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-violet-100/60 p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
              <p className="text-gray-500 mb-6">Join thousands of families finding support.</p>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-violet-600 hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Free forever. No credit card needed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
