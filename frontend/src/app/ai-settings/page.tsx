// src/app/ai-settings/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bot, Send, Loader2, Sparkles, Trash2, CalendarClock, ClipboardList, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm the CPE Portal AI. Ask me about schedules, assignments, lecturers, or anything about the department.",
};

const SUGGESTED_PROMPTS = [
  { icon: CalendarClock, label: "What's on my schedule this week?" },
  { icon: ClipboardList, label: "Which assignments are due soon?" },
  { icon: Users, label: "Who teaches Data Structures this semester?" },
];

export default function AIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      const res = await fetch(`${backendUrl}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: userMsg.content }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${res.status}`);
      }
      const body = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: body.reply || "Sorry, I couldn't get a response right now." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 sm:px-8 py-5 border-b border-gray-100 dark:border-white/10">
        <button
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="h-9 w-9 rounded-xl bg-[#0a0a0a] dark:bg-white/10 flex items-center justify-center shrink-0">
          <Bot size={17} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">CPE AI Assistant</p>
          <p className="text-xs text-gray-400">Context-aware · knows your schedules & assignments</p>
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition shrink-0"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </header>

      <div className="flex-1 flex max-w-4xl w-full mx-auto">
        {/* Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                    <Bot size={13} className="text-gray-500 dark:text-gray-300" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-br-sm"
                      : "bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                  <Bot size={13} className="text-gray-500 dark:text-gray-300" />
                </div>
                <div className="bg-gray-100 dark:bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}

            {/* Suggested prompts — only before the conversation gets going */}
            {messages.length === 1 && !loading && (
              <div className="pt-2 flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(label)}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full px-3.5 py-2 hover:border-green-400/40 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    <Icon size={13} className="text-green-600 dark:text-green-400" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-5 sm:px-8 py-4 border-t border-gray-100 dark:border-white/10 flex items-end gap-2.5"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about schedules, assignments…"
              className="flex-1 resize-none text-sm px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 max-h-32"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 w-11 shrink-0 rounded-2xl bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] flex items-center justify-center hover:opacity-90 transition disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Side panel — desktop only */}
        <aside className="hidden lg:flex w-72 border-l border-gray-100 dark:border-white/10 px-6 py-8 flex-col gap-6 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-green-500 dark:text-green-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">About this assistant</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              The assistant can see your schedules, assignments, and department announcements to
              answer questions specific to you — it doesn't share your data with other students.
            </p>
          </div>
          <div className="h-px bg-gray-100 dark:bg-white/10" />
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-3">Try asking</p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  className="flex items-start gap-2.5 text-left text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <Icon size={15} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}