"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Sparkles,
  ArrowRight,
  Mic,
  MicOff,
  Paperclip,
  CheckCircle,
  X,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "child" | "condition" | "matching" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("child");
  const [childForm, setChildForm] = useState({ name: "", age: "" });
  const [description, setDescription] = useState("");
  const [childId, setChildId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [matchedCondition, setMatchedCondition] = useState("");
  const [matchedGroup, setMatchedGroup] = useState<{ id: string; condition_name: string } | null>(null);
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const liveTranscriptRef = useRef("");

  // Document upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Step 1: Save child ───────────────────────────────────────
  async function handleChildSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { router.push("/login"); return; }

    setUserId(user.id);

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

  // ─── Audio recording ─────────────────────────────────────────
  function startRecording() {
    const SpeechRecognitionAPI =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setAudioSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    liveTranscriptRef.current = description;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) liveTranscriptRef.current += final;
      setDescription(liveTranscriptRef.current + interim);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setDescription(liveTranscriptRef.current);
    setIsRecording(false);
  }

  // ─── Document upload ──────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !childId || !userId) return;

    setUploading(true);
    const supabase = createClient();

    const filePath = `${userId}/${childId}/${Date.now()}-${file.name}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (storageError) {
      // Bucket may not exist yet — show graceful message, still continue
      console.warn("Storage upload failed:", storageError.message);
      setUploadedFileName(file.name + " (upload failed — see setup notes)");
    } else {
      await supabase.from("documents").insert({
        child_id: childId,
        user_id: userId,
        file_path: storageData.path,
        file_name: file.name,
      });
      setUploadedFile(file);
      setUploadedFileName(file.name);
    }
    setUploading(false);
  }

  // ─── Step 2: Match condition ──────────────────────────────────
  async function handleConditionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    // Stop recording if still going
    if (isRecording) stopRecording();

    setStep("matching");
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      await supabase
        .from("children")
        .update({ condition_description: description })
        .eq("id", childId!);

      const res = await fetch("/api/ai/match-condition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, childId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMatchedCondition(data.conditionName);
      setMatchedGroup(data.group);
      setIsNewGroup(data.isNewGroup ?? false);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("condition");
    }
    setLoading(false);
  }

  // ─── Progress bar ─────────────────────────────────────────────
  const stepIndex = ["child", "condition", "matching", "done"].indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="text-blue-600" size={28} fill="currentColor" />
          <span className="text-2xl font-bold text-gray-900">Not Alone</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                stepIndex > i ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* ── Step 1: Child Info ────────────────────────────── */}
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
                  Age <span className="text-gray-400 font-normal">(optional)</span>
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
                {loading ? "Saving…" : <>Continue <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Condition Description ────────────────── */}
        {step === "condition" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Describe {childForm.name}&apos;s condition
            </h1>
            <p className="text-gray-500 mb-6">
              Use your own words, speak it aloud, or upload a prescription — our
              system will find the right group.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
              </div>
            )}

            {!audioSupported && (
              <div className="bg-yellow-50 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4">
                Speech recognition isn&apos;t supported in this browser. Please use Chrome or Edge, or type your description below.
              </div>
            )}

            <form onSubmit={handleConditionSubmit} className="space-y-4">
              {/* Textarea + mic */}
              <div className="relative">
                <textarea
                  required={!description.trim()}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='e.g. "My daughter has a rare genetic condition affecting her muscles — she was diagnosed with SMA Type 2 at age 1"'
                  rows={5}
                  className={`w-full border rounded-lg px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-400 transition-colors ${
                    isRecording ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {/* Mic button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? "Stop recording" : "Speak your description"}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                      : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>

              {/* Recording indicator */}
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording… speak clearly. Click the mic button to stop.
                </div>
              )}

              {/* Document upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Upload a prescription or diagnosis letter{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </p>

                {uploadedFileName ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2.5 rounded-lg">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    <span className="truncate">{uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedFileName("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="ml-auto text-green-600 hover:text-green-800 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !childId}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 text-sm font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Paperclip size={16} />
                    {uploading ? "Uploading…" : "Attach prescription or diagnosis document"}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1">
                  PDF, image, or Word document. Stored securely and only visible to you.
                </p>
              </div>

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

        {/* ── Step 3: Matching ──────────────────────────────── */}
        {step === "matching" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="text-blue-600" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Finding your group…</h1>
            <p className="text-gray-500">
              Matching {childForm.name}&apos;s condition to the right community.
            </p>
          </div>
        )}

        {/* ── Step 4: Done ──────────────────────────────────── */}
        {step === "done" && matchedGroup && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            {isNewGroup ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                    <Users className="text-blue-600" size={32} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  You&apos;re the first one here!
                </h1>
                <p className="text-gray-600 mb-2">
                  No group existed yet for this condition, so we created one for
                </p>
                <div className="bg-blue-50 text-blue-800 font-semibold text-lg px-6 py-3 rounded-xl mb-4">
                  {matchedCondition}
                </div>
                <p className="text-gray-500 text-sm mb-8">
                  You&apos;re a pioneer. As more families join, you&apos;ll build this
                  community together. Share it with anyone you know!
                </p>
              </>
            ) : (
              <>
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
                <div className="bg-blue-50 text-blue-800 font-semibold text-lg px-6 py-3 rounded-xl mb-4">
                  {matchedCondition}
                </div>
                <p className="text-gray-500 text-sm mb-8">
                  Other parents are already here. Jump into the conversation!
                </p>
              </>
            )}

            {uploadedFile && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <CheckCircle size={15} className="text-green-500" />
                {uploadedFile.name} uploaded securely
              </div>
            )}

            <button
              onClick={() => router.push(`/groups/${matchedGroup.id}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isNewGroup ? "Start the conversation" : "Meet your group"}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
