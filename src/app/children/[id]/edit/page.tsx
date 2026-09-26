"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowLeft, Mic, MicOff, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EditChildPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState({
    name: "",
    age: "",
    condition_description: "",
  });
  const [originalCondition, setOriginalCondition] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const liveTranscriptRef = useRef("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("children")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm({
          name: data.name ?? "",
          age: data.age?.toString() ?? "",
          condition_description: data.condition_description ?? "",
        });
        setOriginalCondition(data.condition_description ?? "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function startRecording() {
    const SpeechRecognitionAPI =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    liveTranscriptRef.current = form.condition_description;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) liveTranscriptRef.current += final;
      setForm((f) => ({ ...f, condition_description: liveTranscriptRef.current + interim }));
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setForm((f) => ({ ...f, condition_description: liveTranscriptRef.current }));
    setIsRecording(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isRecording) stopRecording();
    setSaving(true);
    setError("");

    const conditionChanged = form.condition_description !== originalCondition;

    const res = await fetch(`/api/children/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: form.age,
        ...(conditionChanged && { condition_description: form.condition_description }),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);

    setTimeout(() => router.push("/dashboard"), 1200);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="text-blue-600" size={26} fill="currentColor" />
          <span className="text-xl font-bold text-gray-900">Not Alone</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit child profile</h1>
              <p className="text-sm text-gray-500">Update {form.name}&apos;s details</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
              Saved! Redirecting to dashboard…
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child&apos;s name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                max="17"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition description
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Changing this will re-match your child to the most relevant group.
              </p>
              <div className="relative">
                <textarea
                  value={form.condition_description}
                  onChange={(e) =>
                    setForm({ ...form, condition_description: e.target.value })
                  }
                  rows={4}
                  placeholder="Describe your child's condition…"
                  className={`w-full border rounded-lg px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-400 transition-colors ${
                    isRecording ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? "Stop recording" : "Speak"}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                      : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              {isRecording && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Recording…
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Link
                href="/dashboard"
                className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || success}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Save size={15} />
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
