"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Route,
  Send,
  Bot,
  User,
  Plus,
  Sparkles,
  UserCheck,
  Trash2,
} from "lucide-react";

interface Message {
  id?: string;
  sender_role: string;
  content: string;
  created_at?: string;
}

interface Props {
  initialAiMessages: Message[];
  initialAiConversationId: string | null;
  mentorInfo: { id: string; name: string } | null;
  initialHumanMessages: Message[];
  initialHumanConversationId: string | null;
}

type ChatMode = "ai" | "human";

function appendMessage(prev: Message[], next: Message) {
  if (next.id && prev.some((message) => message.id === next.id)) {
    return prev;
  }

  return [...prev, next].sort((a, b) => {
    const left = a.created_at ? new Date(a.created_at).getTime() : 0;
    const right = b.created_at ? new Date(b.created_at).getTime() : 0;
    return left - right;
  });
}

export function MentorChatUI({
  initialAiMessages,
  initialAiConversationId,
  mentorInfo,
  initialHumanMessages,
  initialHumanConversationId,
}: Props) {
  const [mode, setMode] = useState<ChatMode>("ai");
  const [aiMessages, setAiMessages] = useState<Message[]>(initialAiMessages);
  const [humanMessages, setHumanMessages] =
    useState<Message[]>(initialHumanMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiConvId, setAiConvId] = useState<string | null>(
    initialAiConversationId,
  );
  const [humanConvId, setHumanConvId] = useState<string | null>(
    initialHumanConversationId,
  );
  const [clearPending, setClearPending] = useState(false);
  const [clearRequestedByMe, setClearRequestedByMe] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollActiveRef = useRef(true);
  const [supabase] = useState(() => createBrowserClient());

  const messages = mode === "ai" ? aiMessages : humanMessages;

  useEffect(() => {
    const viewport = bottomRef.current?.parentElement;
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    pollActiveRef.current = true;
    return () => {
      pollActiveRef.current = false;
    };
  }, []);

  const resolveHumanConversationId = useCallback(async () => {
    if (!mentorInfo || !pollActiveRef.current) return humanConvId;

    try {
      const res = await fetch("/api/chat/student-conversation", {
        cache: "no-store",
      });

      if (res.status === 401) {
        pollActiveRef.current = false;
        return null;
      }

      if (!res.ok) return humanConvId;

      const data = await res.json();
      const nextConversationId = data.conversationId || null;

      if (nextConversationId && nextConversationId !== humanConvId) {
        setHumanConvId(nextConversationId);
      }

      return nextConversationId;
    } catch {
      return humanConvId;
    }
  }, [humanConvId, mentorInfo]);

  const pollHumanMessages = useCallback(async () => {
    if (!mentorInfo || !pollActiveRef.current) return;

    try {
      const activeConversationId = await resolveHumanConversationId();
      if (!activeConversationId) return;

      const [msgRes, clearRes] = await Promise.all([
        fetch(`/api/chat/messages?conversationId=${activeConversationId}`, {
          cache: "no-store",
        }),
        fetch(`/api/chat/clear?conversationId=${activeConversationId}`, {
          cache: "no-store",
        }),
      ]);

      if (msgRes.status === 401 || clearRes.status === 401) {
        pollActiveRef.current = false;
        return;
      }

      if (msgRes.ok) {
        const data = await msgRes.json();
        if (data.messages) setHumanMessages(data.messages);
      }

      if (clearRes.ok) {
        const clearData = await clearRes.json();
        setClearPending(clearData.clearPending);
        setClearRequestedByMe(clearData.requestedByMe);
      }
    } catch {
      // Ignore transient polling failures.
    }
  }, [mentorInfo, resolveHumanConversationId]);

  useEffect(() => {
    if (!mentorInfo) return;

    void pollHumanMessages();

    const interval = setInterval(() => {
      if (pollActiveRef.current) {
        void pollHumanMessages();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [mentorInfo, pollHumanMessages]);

  useEffect(() => {
    if (!humanConvId) return;

    const channel = supabase
      .channel(`student-chat-${humanConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${humanConvId}`,
        },
        (payload) => {
          const message = payload.new as {
            id: string;
            sender_role: string;
            content: string;
            created_at: string;
          };

          if (message.sender_role !== "mentor") return;

          setHumanMessages((prev) =>
            appendMessage(prev, {
              id: message.id,
              sender_role: message.sender_role,
              content: message.content,
              created_at: message.created_at,
            }),
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void pollHumanMessages();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [humanConvId, pollHumanMessages, supabase]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    if (mode === "ai") {
      setAiMessages((prev) => [
        ...prev,
        {
          sender_role: "user",
          content: text,
          created_at: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, conversationId: aiConvId }),
        });
        const data = await res.json();

        if (!res.ok) {
          toast("Error", data.error || "Failed");
          setSending(false);
          return;
        }

        if (data.conversationId) setAiConvId(data.conversationId);
        setAiMessages((prev) => [
          ...prev,
          {
            sender_role: "ai",
            content: data.reply,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {
        toast("Error", "Network error");
      }
    } else {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender_role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };

      setHumanMessages((prev) => [...prev, optimisticMessage]);

      try {
        const res = await fetch("/api/chat/mentor-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, conversationId: humanConvId }),
        });
        const data = await res.json();

        if (!res.ok) {
          setHumanMessages((prev) =>
            prev.filter((m) => m.id !== optimisticMessage.id),
          );
          toast("Error", data.error || "Failed");
          setSending(false);
          return;
        }

        if (data.conversationId) setHumanConvId(data.conversationId);
        setTimeout(() => {
          void pollHumanMessages();
        }, 500);
      } catch {
        setHumanMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id),
        );
        toast("Error", "Network error");
      }
    }

    setSending(false);
  }

  async function requestClearChat() {
    if (!humanConvId) return;

    try {
      const res = await fetch("/api/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: humanConvId,
          action: "request",
        }),
      });

      if (res.ok) {
        toast(
          "Request Sent",
          "Waiting for mentor to accept the clear request.",
        );
        setClearPending(true);
        setClearRequestedByMe(true);
      }
    } catch {
      toast("Error", "Failed to request clear");
    }
  }

  async function respondClearChat(accept: boolean) {
    if (!humanConvId) return;

    try {
      const res = await fetch("/api/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: humanConvId,
          action: accept ? "accept" : "reject",
        }),
      });

      if (res.ok) {
        if (accept) {
          setHumanMessages([]);
          toast("Cleared", "Chat has been cleared.");
        } else {
          toast("Rejected", "Clear request rejected.");
        }

        setClearPending(false);
        setClearRequestedByMe(false);
      }
    } catch {
      toast("Error", "Failed");
    }
  }

  function startNewAiChat() {
    setAiMessages([]);
    setAiConvId(null);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="eyebrow mb-3">A little guidance goes a long way</p>
          <h1 className="page-title flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky" />
            Your mentor space.
          </h1>
          <p className="text-sm text-muted mt-1">
            Talk through a challenge, make a plan, or find your next step.
          </p>
        </div>

        <div className="flex gap-2">
          {mode === "ai" && (
            <Button onClick={startNewAiChat} className="text-xs gap-1">
              <Plus className="w-3 h-3" />
              New Chat
            </Button>
          )}

          {mode === "human" &&
            humanConvId &&
            humanMessages.length > 0 &&
            !clearPending && (
              <Button
                variant="soft"
                onClick={requestClearChat}
                className="text-xs gap-1 text-rust"
              >
                <Trash2 className="w-3 h-3" />
                Clear Chat
              </Button>
            )}
        </div>
      </div>

      {mode === "human" && clearPending && !clearRequestedByMe && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-800">
            Your mentor has requested to clear this chat.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              onClick={() => respondClearChat(true)}
              className="text-xs bg-rose-500/20 text-rust hover:bg-rose-500/30"
            >
              Accept & Clear
            </Button>
            <Button
              variant="soft"
              onClick={() => respondClearChat(false)}
              className="text-xs"
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {mode === "human" && clearPending && clearRequestedByMe && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-800">
          Waiting for mentor to accept your clear chat request...
        </div>
      )}

      <div
        className="flex flex-wrap gap-2 mb-5"
        role="group"
        aria-label="Choose your mentor"
      >
        <button
          aria-pressed={mode === "ai"}
          aria-controls="mentor-panel"
          onClick={() => setMode("ai")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${mode === "ai" ? "bg-indigo-500/10 border border-indigo-500/20 text-ink" : "bg-paper-soft border border-line text-muted hover:bg-paper-soft"}`}
        >
          <Bot className="w-4 h-4" />
          Sage · AI companion
        </button>

        {mentorInfo ? (
          <button
            aria-pressed={mode === "human"}
            aria-controls="mentor-panel"
            onClick={() => setMode("human")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${mode === "human" ? "bg-emerald-500/10 border border-emerald-500/20 text-ink" : "bg-paper-soft border border-line text-muted hover:bg-paper-soft"}`}
          >
            <UserCheck className="w-4 h-4" />
            {mentorInfo.name}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-paper-soft border border-line text-muted cursor-not-allowed">
            <UserCheck className="w-4 h-4" />
            No mentor assigned
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-5">
        <Card
          id="mentor-panel"
          role="region"
          aria-label={
            mode === "ai" ? "Sage AI companion" : "Assigned mentor conversation"
          }
          className="bg-surface overflow-hidden"
        >
          <CardContent className="p-0">
            <div
              className="h-[min(54vh,600px)] min-h-[340px] overflow-y-auto p-5 md:p-7 space-y-5"
              role="log"
              aria-label="Conversation messages"
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${mode === "ai" ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}
                  >
                    {mode === "ai" ? (
                      <Bot className="w-8 h-8 text-sky" />
                    ) : (
                      <UserCheck className="w-8 h-8 text-forest" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-ink">
                    {mode === "ai"
                      ? "Hi! I'm Sage"
                      : `Chat with ${mentorInfo?.name}`}
                  </h3>
                  <p className="text-sm text-muted mt-2 max-w-sm">
                    {mode === "ai"
                      ? "Ask me about learning strategies, career advice, or study techniques."
                      : "Send a message to your mentor for personalized guidance."}
                  </p>
                  {mode === "ai" && (
                    <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                      {[
                        "Help me plan a study session",
                        "How can I improve my weakest skills?",
                        "How should I prepare for my target role?",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setInput(prompt)}
                          className="rounded-lg border border-line bg-paper px-3 py-2 text-[10px] text-forest hover:bg-lime/40"
                        >
                          {prompt}
                          <ArrowUpRight className="inline ml-2" size={11} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isOwn = m.sender_role === "user";
                  const isAI = m.sender_role === "ai";

                  return (
                    <motion.div
                      key={m.id || `${i}-${m.created_at}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isOwn ? "bg-emerald-500/10 border border-emerald-500/20" : isAI ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}
                      >
                        {isOwn ? (
                          <User className="w-4 h-4 text-forest" />
                        ) : isAI ? (
                          <Bot className="w-4 h-4 text-sky" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-amber-800" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isOwn ? "bg-emerald-500/10 border border-emerald-500/15 text-ink" : "bg-paper-soft border border-line text-muted"}`}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {sending && mode === "ai" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-sky" />
                  </div>
                  <div className="bg-paper-soft border border-line rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="border-t border-line p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  aria-label={
                    mode === "ai" ? "Message Sage" : "Message your mentor"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "ai"
                      ? "Ask Sage about learning, career, study tips..."
                      : `Message ${mentorInfo?.name || "mentor"}...`
                  }
                  disabled={sending || (mode === "human" && !mentorInfo)}
                  className="flex-1"
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  aria-label="Send message"
                  disabled={sending || !input.trim()}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
        <aside className="space-y-4">
          <section className="panel p-5">
            <span className="icon-tile !h-9 !w-9">
              <BookOpen size={17} />
            </span>
            <h2 className="font-semibold mt-4">A space to think out loud.</h2>
            <p className="mt-3 text-[11px] leading-6 text-muted">
              Bring the question you’re stuck on, the goal you’re working
              toward, or the topic you want to understand better.
            </p>
            <div className="mt-5 pt-4 border-t border-line text-[10px] leading-5 text-muted">
              {mode === "ai"
                ? "Sage is an AI companion. Responses may need checking. Your messages are processed by Gemini."
                : "Your assigned mentor can see and reply to this conversation. Replies may take some time."}
            </div>
          </section>
          <Link
            href="/roadmap"
            className="flex items-center gap-3 panel p-4 text-xs font-semibold hover:bg-paper-soft"
          >
            <Route size={17} className="text-forest" />
            Back to your roadmap
            <ArrowUpRight size={13} className="ml-auto text-muted" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
