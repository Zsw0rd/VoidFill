"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, GraduationCap, MessageCircle } from "lucide-react";

interface Message {
    id?: string;
    sender_id?: string;
    sender_role: string;
    content: string;
    created_at?: string;
}

interface Props {
    mentorId: string;
    students: { id: string; name: string }[];
    conversations: any[];
    initialMessages: Message[];
    initialConversationId: string | null;
}

export function MentorChatPanel({ mentorId, students, conversations: initialConversations, initialMessages, initialConversationId }: Props) {
    const [selectedStudent, setSelectedStudent] = useState<string>(
        initialConversations[0]?.user_id || students[0]?.id || ""
    );
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const [conversations, setConversations] = useState<any[]>(initialConversations);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ═══ Poll: discover new conversations + fetch messages ═══
    const pollMessages = useCallback(async () => {
        // Always try to discover conversations for the current student
        if (selectedStudent) {
            try {
                const discoverRes = await fetch(`/api/chat/mentor-conversations?studentId=${selectedStudent}`);
                if (discoverRes.ok) {
                    const discoverData = await discoverRes.json();
                    if (discoverData.conversationId) {
                        setConversationId(prev => {
                            if (prev !== discoverData.conversationId) {
                                // New conversation discovered
                                return discoverData.conversationId;
                            }
                            return prev;
                        });

                        // Fetch messages for this conversation
                        const msgRes = await fetch(`/api/chat/messages?conversationId=${discoverData.conversationId}`);
                        if (msgRes.ok) {
                            const msgData = await msgRes.json();
                            if (msgData.messages && Array.isArray(msgData.messages)) {
                                setMessages(msgData.messages);
                            }
                        }
                    }
                }
            } catch { /* ignore */ }
        }
    }, [selectedStudent]);

    useEffect(() => {
        const interval = setInterval(pollMessages, 3000);
        return () => clearInterval(interval);
    }, [pollMessages]);

    async function loadStudentChat(studentId: string) {
        setSelectedStudent(studentId);
        setMessages([]);
        setConversationId(null);

        // Try to find existing conversation
        try {
            const res = await fetch(`/api/chat/mentor-conversations?studentId=${studentId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.conversationId) {
                    setConversationId(data.conversationId);
                    const msgRes = await fetch(`/api/chat/messages?conversationId=${data.conversationId}`);
                    if (msgRes.ok) {
                        const msgData = await msgRes.json();
                        setMessages(msgData.messages || []);
                    }
                }
            }
        } catch { /* ignore */ }
    }

    async function sendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        const text = input.trim();
        if (!text || sending || !selectedStudent) return;

        setInput("");
        setSending(true);

        // Optimistic add
        setMessages(prev => [...prev, { sender_role: "mentor", content: text, sender_id: mentorId, created_at: new Date().toISOString() }]);

        try {
            const res = await fetch("/api/chat/mentor-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationId, targetUserId: selectedStudent }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast("Error", data.error || "Failed to send");
                setSending(false);
                return;
            }
            if (data.conversationId) {
                setConversationId(data.conversationId);
                // Sync messages
                setTimeout(async () => {
                    try {
                        const r = await fetch(`/api/chat/messages?conversationId=${data.conversationId}`);
                        if (r.ok) {
                            const d = await r.json();
                            if (d.messages) setMessages(d.messages);
                        }
                    } catch { }
                }, 500);
            }
        } catch {
            toast("Error", "Network error");
        }
        setSending(false);
    }

    const studentName = students.find(s => s.id === selectedStudent)?.name || "Student";

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-indigo-400" />
                Student Chats
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Chat with your assigned students</p>

            <div className="mt-4 flex gap-4 flex-col md:flex-row">
                {/* Student selector */}
                <div className="md:w-48 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0">
                    {students.map(s => (
                        <button
                            key={s.id}
                            onClick={() => loadStudentChat(s.id)}
                            className={`whitespace-nowrap text-left rounded-xl px-3 py-2.5 text-sm transition ${selectedStudent === s.id
                                ? "bg-indigo-500/10 border border-indigo-500/20 text-white"
                                : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 shrink-0" />
                                <span className="truncate">{s.name}</span>
                            </div>
                        </button>
                    ))}
                    {students.length === 0 && (
                        <div className="text-xs text-zinc-500 p-2">No students assigned</div>
                    )}
                </div>

                {/* Chat area */}
                <Card className="flex-1 bg-zinc-900/40 backdrop-blur-xl">
                    <CardContent className="p-0">
                        <div className="px-4 py-3 border-b border-white/10">
                            <div className="text-sm font-medium">{studentName}</div>
                        </div>

                        <div className="h-[50vh] overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                                    No messages yet. Start the conversation!
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={m.id || `${i}-${m.created_at}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-2 ${m.sender_role === "mentor" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.sender_role === "mentor" ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                                            {m.sender_role === "mentor" ? <User className="w-3.5 h-3.5 text-indigo-300" /> : <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />}
                                        </div>
                                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "mentor" ? "bg-indigo-500/10 border border-indigo-500/15 text-zinc-200" : "bg-white/5 border border-white/10 text-zinc-300"}`}>
                                            {m.content}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={bottomRef} />
                        </div>

                        <div className="border-t border-white/10 p-3">
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <Input value={input} onChange={e => setInput(e.target.value)} placeholder={`Message ${studentName}...`} disabled={sending || !selectedStudent} className="flex-1 text-sm" maxLength={2000} />
                                <Button type="submit" disabled={sending || !input.trim()} className="px-3"><Send className="w-4 h-4" /></Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
