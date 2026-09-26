"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Heart, ArrowLeft, Send, MessageCircle } from "lucide-react";
import type { DirectMessage } from "@/types";

interface DMViewProps {
  otherUserId: string;
  otherUserName: string;
  initialMessages: DirectMessage[];
  currentUserId: string;
  currentUserName: string;
}

export default function DMView({
  otherUserId,
  otherUserName,
  initialMessages,
  currentUserId,
  currentUserName,
}: DMViewProps) {
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dm-${[currentUserId, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          const isRelevant =
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.recipient_id === currentUserId);
          if (!isRelevant) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                ...newMsg,
                profiles: {
                  id: newMsg.sender_id,
                  full_name:
                    newMsg.sender_id === currentUserId ? currentUserName : otherUserName,
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
  }, [currentUserId, otherUserId, currentUserName, otherUserName]);

  // Scroll to bottom on new messages (only if near bottom)
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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const res = await fetch(`/api/direct-messages/${otherUserId}`, {
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
    } else {
      const err = await res.json().catch(() => ({}));
      console.error("DM send failed:", res.status, err);
      alert(`Failed to send message: ${err.error ?? res.statusText}`);
      setNewMessage(content); // restore the message
    }
    setSending(false);
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

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
                {otherUserName}
              </div>
              <div className="text-xs text-gray-400">Private message</div>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-1.5">
            <Heart className="text-rose-500" size={18} fill="currentColor" />
            <span className="text-sm font-bold text-gray-900 hidden sm:block">Not Alone</span>
          </Link>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4" style={{ height: "calc(100vh - 72px)" }}>
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto py-4 space-y-1"
        >
          {messages.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
              <p>Start a private conversation with {otherUserName}.</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId;
            const prevMsg = messages[i - 1];
            const showDateSep =
              !prevMsg ||
              getDateLabel(msg.created_at) !== getDateLabel(prevMsg.created_at);

            return (
              <div key={msg.id}>
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
                    {isOwn ? "You" : otherUserName} · {formatTime(msg.created_at)}
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
              placeholder={`Message ${otherUserName}…`}
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
    </div>
  );
}
