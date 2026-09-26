"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LogOut,
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
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [senderPopover, setSenderPopover] = useState<{ userId: string; name: string } | null>(null);
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
  const profilesMapRef = useRef<Record<string, string>>({});

  // Build profiles cache from initial messages (once)
  useEffect(() => {
    initialMessages.forEach((msg) => {
      const name = (msg.profiles as { full_name?: string })?.full_name;
      if (name && msg.user_id) profilesMapRef.current[msg.user_id] = name;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          const senderId = newMsg.user_id;

          if (senderId === userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, profiles: { id: senderId, full_name: userFullName, location: null, created_at: "", updated_at: "" } }];
            });
            return;
          }

          const cachedName = profilesMapRef.current[senderId];
          if (cachedName) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, profiles: { id: senderId, full_name: cachedName, location: null, created_at: "", updated_at: "" } }];
            });
          } else {
            supabase.from("profiles").select("full_name").eq("id", senderId).single().then(({ data }) => {
              const name = data?.full_name ?? "Member";
              profilesMapRef.current[senderId] = name;
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, { ...newMsg, profiles: { id: senderId, full_name: name, location: null, created_at: "", updated_at: "" } }];
              });
            });
          }
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
      older.forEach((msg) => {
        const name = (msg.profiles as { full_name?: string })?.full_name;
        if (name && msg.user_id) profilesMapRef.current[msg.user_id] = name;
      });
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

  async function leaveGroup() {
    if (!confirm(`Leave the ${group.condition_name} group? You can rejoin later by re-adding a child with this condition.`)) return;
    setLeavingGroup(true);
    const res = await fetch(`/api/groups/${group.id}/leave`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`Could not leave group: ${body.error ?? res.statusText}`);
      setLeavingGroup(false);
      return;
    }
    // Full page reload so the dashboard fetches fresh data from the server
    window.location.href = "/dashboard";
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
    return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
          <div className="flex items-center gap-3">
            <button
              onClick={leaveGroup}
              disabled={leavingGroup}
              title="Leave group"
              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <LogOut size={18} />
            </button>
            <Link href="/" className="flex items-center gap-1.5">
              <Heart className="text-rose-500" size={18} fill="currentColor" />
              <span className="text-sm font-bold text-gray-900 hidden sm:block">Not Alone</span>
            </Link>
          </div>
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
                  ? "border-violet-600 text-violet-600"
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
                  className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-full transition-colors disabled:opacity-50"
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
              const isSystem = msg.content === "[[joined]]" || msg.content === "[[left]]";
              const senderName = isOwn
                ? "You"
                : (msg.profiles as { full_name?: string })?.full_name || "Someone";

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

                  {/* System event pill */}
                  {isSystem ? (
                    <div className="flex items-center gap-3 my-3 px-2">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        msg.content === "[[joined]]"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {senderName} {msg.content === "[[joined]]" ? "joined" : "left"} · {formatTime(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  ) : (
                    <div className={`flex flex-col mb-2 ${isOwn ? "items-end" : "items-start"}`}>
                      <div className="text-xs text-gray-400 mb-1 px-1">
                        {isOwn ? (
                          <>You · {formatTime(msg.created_at)}</>
                        ) : (
                          <>
                            <button
                              onClick={() => setSenderPopover({ userId: msg.user_id, name: (msg.profiles as { full_name?: string })?.full_name || "Member" })}
                              className="hover:text-violet-600 hover:underline transition-colors"
                            >
                              {(msg.profiles as { full_name?: string })?.full_name || "Member"}
                            </button>
                            {" · "}{formatTime(msg.created_at)}
                          </>
                        )}
                      </div>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isOwn
                            ? "bg-violet-600 text-white rounded-tr-sm"
                            : "bg-white border border-gray-100 text-gray-900 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )}
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
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-4 py-2.5 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sender DM popover */}
      {senderPopover && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30"
          onClick={() => setSenderPopover(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs mx-4 mb-4 sm:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">{senderPopover.name}</div>
            <div className="text-xs text-gray-400 mb-4">Member of this group</div>
            <Link
              href={`/messages/${senderPopover.userId}`}
              className="flex items-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors justify-center"
              onClick={() => setSenderPopover(null)}
            >
              <MessageCircle size={16} />
              Message {senderPopover.name.split(" ")[0]} privately
            </Link>
            <button
              className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              onClick={() => setSenderPopover(null)}
            >
              Cancel
            </button>
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
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <textarea
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder="What helped? (optional)"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <input
                type="url"
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder="Link (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  className="text-sm bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
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
                        className="text-violet-600 hover:text-violet-700 ml-2 flex-shrink-0"
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
