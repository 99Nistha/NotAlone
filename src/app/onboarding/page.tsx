"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "child" | "condition" | "matching" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("child");
  const [childForm, setChildForm] = useState({ name: "", age: "" });
  const [description, setDescription] = useState("");
  const [childId, setChildId] = useState<string | null>(null);
  const [matchedCondition, setMatchedCondition] = useState("");
  const [matchedGroup, setMatchedGroup] = useState<{ id: string; condition_name: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChildSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: childError } = await supabase
      .from("children")
      .insert({
        parent_id: user.id,
        name: childForm.name,
        age: childForm.age ? parseInt(childForm.age) : null,
      })
      .select()
      .single();

    if (childError) {
      setError(childError.message);
    } else {
      setChildId(data.id);
      setStep("condition");
    }
    setLoading(false);
  }

  async function handleConditionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setStep("matching");
    setLoading(true);
    setError("");

    try {
      // Update child with description
      const supabase = createClient();
      await supabase
        .from("children")
        .update({ condition_description: description })
        .eq("id", childId!);

      // AI match
      const res = await fetch("/api/ai/match-condition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, childId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMatchedCondition(data.conditionName);
      setMatchedGroup(data.group);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("condition");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="text-blue-600" size={28} fill="currentColor" />
          <span className="text-2xl font-bold text-gray-900">Not Alone</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {["child", "condition", "done"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                ["child", "condition", "matching", "done"].indexOf(step) > i - 1
                  ? "bg-blue-600"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step: Child Info */}
        {step === "child" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tell us about your child
            </h1>
            <p className="text-gray-500 mb-6">
              We&apos;ll use this to find families with similar experiences.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleChildSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child&apos;s name
                </label>
                <input
                  type="text"
                  required
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  placeholder="Alex"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={childForm.age}
                  onChange={(e) => setChildForm({ ...childForm, age: e.target.value })}
                  placeholder="e.g. 7"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? "Saving…" : "Continue"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        )}

        {/* Step: Condition Description */}
        {step === "condition" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Describe {childForm.name}&apos;s condition
            </h1>
            <p className="text-gray-500 mb-6">
              Use your own words — medical terms, plain English, or both. Our AI will
              find the right group.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleConditionSubmit} className="space-y-4">
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='e.g. "My daughter has a rare genetic condition affecting her muscles — she was diagnosed with SMA Type 2 at age 1"'
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Find my community
              </button>
            </form>
          </div>
        )}

        {/* Step: AI Matching */}
        {step === "matching" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="text-blue-600" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Finding your group…</h1>
            <p className="text-gray-500">
              Our AI is matching {childForm.name}&apos;s condition to the right community.
            </p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && matchedGroup && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <Heart className="text-green-600" size={32} fill="currentColor" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;ve found your community!
            </h1>
            <p className="text-gray-600 mb-2">
              {childForm.name} has been matched to the
            </p>
            <div className="bg-blue-50 text-blue-800 font-semibold text-lg px-6 py-3 rounded-xl mb-6">
              {matchedCondition}
            </div>
            <p className="text-gray-500 text-sm mb-8">
              You&apos;ve been added to a group of parents navigating the same journey.
            </p>
            <button
              onClick={() => router.push(`/groups/${matchedGroup.id}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Meet your group
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
