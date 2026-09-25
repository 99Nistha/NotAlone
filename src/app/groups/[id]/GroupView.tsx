"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Heart,
  ArrowLeft,
  Send,
  BookOpen,
  MessageCircle,
  PlusCircle,
  ExternalLink,
  ChevronUp,
} from "lucide-react";
import type { Group, Message, Resource } from "@/types";

interface GroupViewProps {
  group: Group;
  initialMessages: Message[];
  initialResources: Resource[];
  userId: string;
  userFullName: string;
}

type Tab = "chat" | "resources";

const PAGE_SIZE = 50;

export default function GroupView({
  group,
  initialMessages,
  initialResources,
  userId,
  userFullName,
}: GroupViewProps) {
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: "", description: "", url: "" });
  const [addingResource, setAddingResource] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState(
    initialMessages.length >= PAGE_SIZE
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`group-${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                ...newMsg,
                profiles: {
                  id: newMsg.user_id,
                  full_name:
                    newMsg.user_id === userId ? userFullName : "Member",
                  location: null,
                  created_at: "",
                  updated_at: "",
                },
              },
            ];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [group.id, userId, userFullName]);

  // Scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to bottom on first load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  // Load earlier messages
  const loadEarlierMessages = useCallback(async () => {
    if (loadingEarlier || !hasEarlierMessages || messages.length === 0) return;
    setLoadingEarlier(true);

    const oldest = messages[0].created_at;
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*, profiles(full_name)")
      .eq("group_id", group.id)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data && data.length > 0) {
      const older = [...data].reverse() as Message[];
      setMessages((prev) => [...older, ...prev]);
      setHasEarlierMessages(data.length >= PAGE_SIZE);

      // Restore scroll position so user doesn't jump
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } else {
      setHasEarlierMessages(false);
    }

    setLoadingEarlier(false);
  }, [loadingEarlier, hasEarlierMessages, messages, group.id]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const res = await fetch(`/api/groups/${group.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setSending(false);
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resourceForm.title.trim() || addingResource) return;

    setAddingResource(true);

    const res = await fetch(`/api/groups/${group.id}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resourceForm),
    });

    if (res.ok) {
      const data = await res.json();
      setResources((prev) => [data.resource, ...prev]);
      setResourceForm({ title: "", description: "", url: "" });
      setShowResourceForm(false);
    }
    setAddingResource(false);
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  // Group messages by date for date separators
  function getDateLabel(ts: string) {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="font-semibold text-gray-900 text-sm leading-tight">
                {group.condition_name}
              </div>
              <div className="text-xs text-gray-400">{group.member_count} {group.member_count === 1 ? "member" : "members"}</div>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <Heart className="text-blue-600" size={18} fill="currentColor" />
            <span className="text-sm font-bold text-gray-900 hidden sm:block">Not Alone</span>
          </Link>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {(["chat", "resources"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "chat" ? <MessageCircle size={15} /> : <BookOpen size={15} />}
              {t === "chat" ? "Chat" : "Resources"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      {tab === "chat" && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4" style={{ height: "calc(100vh - 120px)" }}>
          {/* Messages scrollable area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto py-4 space-y-1"
          >
            {/* Load earlier button */}
            {hasEarlierMessages && messages.length > 0 && (
              <div className="flex justify-center pb-4">
                <button
                  onClick={loadEarlierMessages}
                  disabled={loadingEarlier}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                >
                  <ChevronUp size={15} />
                  {loadingEarlier ? "Loading…" : "Load earlier messages"}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
                <p>No messages yet. Be the first to say hello!</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isOwn = msg.user_id === userId;
              const prevMsg = messages[i - 1];
              const showDateSep =
                !prevMsg ||
                getDateLabel(msg.created_at) !== getDateLabel(prevMsg.created_at);

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium">
                        {getDateLabel(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}

                  <div className={`flex flex-col mb-2 ${isOwn ? "items-end" : "items-start"}`}>
                    <div className="text-xs text-gray-400 mb-1 px-1">
                      {isOwn
                        ? "You"
                        : (msg.profiles as { full_name?: string })?.full_name || "Member"}{" "}
                      · {formatTime(msg.created_at)}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-white border border-gray-100 text-gray-900 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 bg-white py-3">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2.5 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Resources */}
      {tab === "resources" && (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-gray-900">What&apos;s worked for us</h2>
            <button
              onClick={() => setShowResourceForm(!showResourceForm)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <PlusCircle size={16} /> Add resource
            </button>
          </div>

          {showResourceForm && (
            <form
              onSubmit={addResource}
              className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-sm space-y-3"
            >
              <input
                type="text"
                required
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder="Resource title *"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder="What helped? (optional)"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <input
                type="url"
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder="Link (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResourceForm(false)}
                  className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingResource}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {addingResource ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          )}

          {resources.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p>No resources yet. Share what&apos;s helped your family!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resources.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900">{r.title}</div>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 ml-2 flex-shrink-0"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Shared by {(r.profiles as { full_name?: string })?.full_name || "a member"} · {formatDate(r.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
