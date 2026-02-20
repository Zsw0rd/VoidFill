"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Plus, Sparkles, UserCheck, Trash2 } from "lucide-react";

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

export function MentorChatUI({ initialAiMessages, initialAiConversationId, mentorInfo, initialHumanMessages, initialHumanConversationId }: Props) {
    const [mode, setMode] = useState<ChatMode>("ai");
    const [aiMessages, setAiMessages] = useState<Message[]>(initialAiMessages);
    const [humanMessages, setHumanMessages] = useState<Message[]>(initialHumanMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [aiConvId, setAiConvId] = useState<string | null>(initialAiConversationId);
    const [humanConvId] = useState<string | null>(initialHumanConversationId);
    const [clearPending, setClearPending] = useState(false);
    const [clearRequestedByMe, setClearRequestedByMe] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollActiveRef = useRef(true);

    const messages = mode === "ai" ? aiMessages : humanMessages;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { pollActiveRef.current = false; };
    }, []);

    // Poll for human messages + clear status (stops on 401 / unmount)
    const pollHumanMessages = useCallback(async () => {
        if (!humanConvId || !pollActiveRef.current) return;
        try {
            const [msgRes, clearRes] = await Promise.all([
                fetch(`/api/chat/messages?conversationId=${humanConvId}`),
                fetch(`/api/chat/clear?conversationId=${humanConvId}`),
            ]);
            // Stop polling if unauthorized (user logged out)
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
        } catch { /* ignore network errors */ }
    }, [humanConvId]);

    useEffect(() => {
        if (!humanConvId) return;
        const interval = setInterval(() => {
            if (pollActiveRef.current) pollHumanMessages();
        }, 3000);
        return () => clearInterval(interval);
    }, [humanConvId, pollHumanMessages]);

    async function sendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        setSending(true);

        if (mode === "ai") {
            setAiMessages(prev => [...prev, { sender_role: "user", content: text, created_at: new Date().toISOString() }]);
            try {
                const res = await fetch("/api/chat/send", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text, conversationId: aiConvId }),
                });
                const data = await res.json();
                if (!res.ok) { toast("Error", data.error || "Failed"); setSending(false); return; }
                if (data.conversationId) setAiConvId(data.conversationId);
                setAiMessages(prev => [...prev, { sender_role: "ai", content: data.reply, created_at: new Date().toISOString() }]);
            } catch { toast("Error", "Network error"); }
        } else {
            setHumanMessages(prev => [...prev, { sender_role: "user", content: text, created_at: new Date().toISOString() }]);
            try {
                const res = await fetch("/api/chat/mentor-send", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text, conversationId: humanConvId }),
                });
                const data = await res.json();
                if (!res.ok) { toast("Error", data.error || "Failed"); setSending(false); return; }
                setTimeout(() => pollHumanMessages(), 500);
            } catch { toast("Error", "Network error"); }
        }
        setSending(false);
    }

    async function requestClearChat() {
        if (!humanConvId) return;
        try {
            const res = await fetch("/api/chat/clear", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: humanConvId, action: "request" }),
            });
            if (res.ok) {
                toast("Request Sent", "Waiting for mentor to accept the clear request.");
                setClearPending(true);
                setClearRequestedByMe(true);
            }
        } catch { toast("Error", "Failed to request clear"); }
    }

    async function respondClearChat(accept: boolean) {
        if (!humanConvId) return;
        try {
            const res = await fetch("/api/chat/clear", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: humanConvId, action: accept ? "accept" : "reject" }),
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
        } catch { toast("Error", "Failed"); }
    }

    function startNewAiChat() { setAiMessages([]); setAiConvId(null); }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-indigo-400" />Mentor
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">Get help from AI or your assigned mentor</p>
                </div>
                <div className="flex gap-2">
                    {mode === "ai" && (
                        <Button onClick={startNewAiChat} className="text-xs gap-1"><Plus className="w-3 h-3" /> New Chat</Button>
                    )}
                    {mode === "human" && humanConvId && humanMessages.length > 0 && !clearPending && (
                        <Button variant="soft" onClick={requestClearChat} className="text-xs gap-1 text-rose-400">
                            <Trash2 className="w-3 h-3" /> Clear Chat
                        </Button>
                    )}
                </div>
            </div>

            {/* Clear chat notification */}
            {mode === "human" && clearPending && !clearRequestedByMe && (
                <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-200">Your mentor has requested to clear this chat.</p>
                    <div className="mt-2 flex gap-2">
                        <Button onClick={() => respondClearChat(true)} className="text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30">Accept & Clear</Button>
                        <Button variant="soft" onClick={() => respondClearChat(false)} className="text-xs">Reject</Button>
                    </div>
                </div>
            )}
            {mode === "human" && clearPending && clearRequestedByMe && (
                <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                    ⏳ Waiting for mentor to accept your clear chat request...
                </div>
            )}

            {/* Mode tabs */}
            <div className="flex gap-2 mb-4">
                <button onClick={() => setMode("ai")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${mode === "ai" ? "bg-indigo-500/10 border border-indigo-500/20 text-white" : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"}`}>
                    <Bot className="w-4 h-4" /> AI Mentor — Sage
                </button>
                {mentorInfo ? (
                    <button onClick={() => setMode("human")}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${mode === "human" ? "bg-emerald-500/10 border border-emerald-500/20 text-white" : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"}`}>
                        <UserCheck className="w-4 h-4" /> {mentorInfo.name}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-zinc-600 cursor-not-allowed">
                        <UserCheck className="w-4 h-4" /> No mentor assigned
                    </div>
                )}
            </div>

            <Card className="bg-zinc-900/40 backdrop-blur-xl">
                <CardContent className="p-0">
                    <div className="h-[55vh] overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${mode === "ai" ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                                    {mode === "ai" ? <Bot className="w-8 h-8 text-indigo-400" /> : <UserCheck className="w-8 h-8 text-emerald-400" />}
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-200">
                                    {mode === "ai" ? "Hi! I'm Sage" : `Chat with ${mentorInfo?.name}`}
                                </h3>
                                <p className="text-sm text-zinc-400 mt-2 max-w-sm">
                                    {mode === "ai" ? "Ask me about learning strategies, career advice, or study techniques!" : "Send a message to your mentor for personalized guidance."}
                                </p>
                            </div>
                        )}
                        <AnimatePresence initial={false}>
                            {messages.map((m, i) => {
                                const isOwn = m.sender_role === "user";
                                const isAI = m.sender_role === "ai";
                                return (
                                    <motion.div key={m.id || `${i}-${m.created_at}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                                        className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isOwn ? "bg-emerald-500/10 border border-emerald-500/20" : isAI ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                                            {isOwn ? <User className="w-4 h-4 text-emerald-300" /> : isAI ? <Bot className="w-4 h-4 text-indigo-300" /> : <UserCheck className="w-4 h-4 text-amber-300" />}
                                        </div>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isOwn ? "bg-emerald-500/10 border border-emerald-500/15 text-zinc-200" : "bg-white/5 border border-white/10 text-zinc-300"}`}>
                                            <div className="whitespace-pre-wrap">{m.content}</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {sending && mode === "ai" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><Bot className="w-4 h-4 text-indigo-300" /></div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                    <div className="border-t border-white/10 p-4">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <Input value={input} onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === "ai" ? "Ask Sage about learning, career, study tips..." : `Message ${mentorInfo?.name || "mentor"}...`}
                                disabled={sending || (mode === "human" && !mentorInfo)} className="flex-1" maxLength={2000} />
                            <Button type="submit" disabled={sending || !input.trim()} className="px-4"><Send className="w-4 h-4" /></Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
