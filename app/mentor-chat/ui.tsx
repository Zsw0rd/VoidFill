"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Plus, MessageCircle, Sparkles } from "lucide-react";

interface Message {
    id?: string;
    sender_role: "user" | "ai" | "system";
    content: string;
    created_at?: string;
}

interface Props {
    initialMessages: Message[];
    initialConversationId: string | null;
    conversations: { id: string; title: string; created_at: string }[];
}

export function MentorChatUI({ initialMessages, initialConversationId, conversations: initConvs }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        const text = input.trim();
        if (!text || sending) return;

        setInput("");
        setSending(true);

        // Optimistic add
        const userMsg: Message = { sender_role: "user", content: text, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationId }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast("Error", data.error || "Failed to send message");
                setSending(false);
                return;
            }

            if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
            }

            const aiMsg: Message = { sender_role: "ai", content: data.reply, created_at: new Date().toISOString() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            toast("Error", "Network error — please try again");
        }

        setSending(false);
    }

    function startNewChat() {
        setMessages([]);
        setConversationId(null);
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                        AI Mentor — Sage
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">Your personal education & career mentor</p>
                </div>
                <Button onClick={startNewChat} className="text-xs gap-1">
                    <Plus className="w-3 h-3" /> New Chat
                </Button>
            </div>

            <Card className="bg-zinc-900/40 backdrop-blur-xl">
                <CardContent className="p-0">
                    {/* Messages area */}
                    <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                    <Bot className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-200">Hi! I&apos;m Sage</h3>
                                <p className="text-sm text-zinc-400 mt-2 max-w-sm">
                                    I&apos;m your AI study mentor. Ask me about learning strategies, career advice,
                                    skill development, or study techniques!
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    {[
                                        "How do I improve my SQL skills?",
                                        "What should I learn as a beginner?",
                                        "Tips for staying consistent?",
                                        "Career advice for Data Analyst",
                                    ].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => { setInput(q); }}
                                            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-zinc-300 transition"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex gap-3 ${m.sender_role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${m.sender_role === "user"
                                            ? "bg-emerald-500/10 border border-emerald-500/20"
                                            : "bg-indigo-500/10 border border-indigo-500/20"
                                        }`}>
                                        {m.sender_role === "user"
                                            ? <User className="w-4 h-4 text-emerald-300" />
                                            : <Bot className="w-4 h-4 text-indigo-300" />
                                        }
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.sender_role === "user"
                                            ? "bg-emerald-500/10 border border-emerald-500/15 text-zinc-200"
                                            : "bg-white/5 border border-white/10 text-zinc-300"
                                        }`}>
                                        <div className="whitespace-pre-wrap">{m.content}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {sending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-indigo-300" />
                                </div>
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

                    {/* Input bar */}
                    <div className="border-t border-white/10 p-4">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Sage about learning, career, study tips..."
                                disabled={sending}
                                className="flex-1"
                                maxLength={2000}
                            />
                            <Button type="submit" disabled={sending || !input.trim()} className="px-4">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                        <div className="mt-2 text-[10px] text-zinc-600 text-center">
                            Sage only discusses education, learning, and career topics. Inappropriate messages are flagged.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
