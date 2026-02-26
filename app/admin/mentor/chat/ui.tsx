"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast/bus";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, GraduationCap, MessageCircle, Trash2 } from "lucide-react";

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

function appendMessage(prev: Message[], next: Message) {
    if (next.id && prev.some(message => message.id === next.id)) {
        return prev;
    }

    return [...prev, next].sort((a, b) => {
        const left = a.created_at ? new Date(a.created_at).getTime() : 0;
        const right = b.created_at ? new Date(b.created_at).getTime() : 0;
        return left - right;
    });
}

export function MentorChatPanel({
    mentorId,
    students,
    conversations: initialConversations,
    initialMessages,
    initialConversationId,
}: Props) {
    const [selectedStudent, setSelectedStudent] = useState<string>(
        initialConversations[0]?.user_id || students[0]?.id || "",
    );
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const [clearPending, setClearPending] = useState(false);
    const [clearRequestedByMe, setClearRequestedByMe] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [supabase] = useState(() => createBrowserClient());

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const pollMessages = useCallback(async () => {
        if (!selectedStudent) return;

        try {
            const discoverRes = await fetch(`/api/chat/mentor-conversations?studentId=${selectedStudent}`, { cache: "no-store" });
            if (!discoverRes.ok) return;

            const discoverData = await discoverRes.json();
            if (!discoverData.conversationId) return;

            const cid = discoverData.conversationId;
            setConversationId(cid);

            const [msgRes, clearRes] = await Promise.all([
                fetch(`/api/chat/messages?conversationId=${cid}`, { cache: "no-store" }),
                fetch(`/api/chat/clear?conversationId=${cid}`, { cache: "no-store" }),
            ]);

            if (msgRes.ok) {
                const msgData = await msgRes.json();
                if (msgData.messages) setMessages(msgData.messages);
            }

            if (clearRes.ok) {
                const clearData = await clearRes.json();
                setClearPending(clearData.clearPending);
                setClearRequestedByMe(clearData.requestedByMe);
            }
        } catch {
            // Ignore transient polling failures.
        }
    }, [selectedStudent]);

    useEffect(() => {
        const interval = setInterval(() => {
            void pollMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [pollMessages]);

    async function loadStudentChat(studentId: string) {
        setSelectedStudent(studentId);
        setMessages([]);
        setConversationId(null);
        setClearPending(false);
        setClearRequestedByMe(false);

        try {
            const res = await fetch(`/api/chat/mentor-conversations?studentId=${studentId}`, { cache: "no-store" });
            if (!res.ok) return;

            const data = await res.json();
            if (!data.conversationId) return;

            setConversationId(data.conversationId);

            const msgRes = await fetch(`/api/chat/messages?conversationId=${data.conversationId}`, { cache: "no-store" });
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                setMessages(msgData.messages || []);
            }
        } catch {
            // Ignore manual refresh failures.
        }
    }

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`mentor-chat-${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const message = payload.new as {
                        id: string;
                        sender_id?: string;
                        sender_role: string;
                        content: string;
                        created_at: string;
                    };

                    if (message.sender_role !== "user") return;

                    setMessages(prev => appendMessage(prev, {
                        id: message.id,
                        sender_id: message.sender_id,
                        sender_role: message.sender_role,
                        content: message.content,
                        created_at: message.created_at,
                    }));
                },
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    void pollMessages();
                }
            });

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [conversationId, pollMessages, supabase]);

    async function sendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        const text = input.trim();
        if (!text || sending || !selectedStudent) return;

        setInput("");
        setSending(true);

        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            sender_role: "mentor",
            content: text,
            sender_id: mentorId,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const res = await fetch("/api/chat/mentor-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationId, targetUserId: selectedStudent }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
                toast("Error", data.error || "Failed to send");
                setSending(false);
                return;
            }

            if (data.conversationId) setConversationId(data.conversationId);
            setTimeout(() => {
                void pollMessages();
            }, 500);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            toast("Error", "Network error");
        }

        setSending(false);
    }

    async function requestClearChat() {
        if (!conversationId) return;

        try {
            const res = await fetch("/api/chat/clear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, action: "request" }),
            });

            if (res.ok) {
                toast("Request Sent", "Waiting for student to accept.");
                setClearPending(true);
                setClearRequestedByMe(true);
            }
        } catch {
            toast("Error", "Failed");
        }
    }

    async function respondClearChat(accept: boolean) {
        if (!conversationId) return;

        try {
            const res = await fetch("/api/chat/clear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, action: accept ? "accept" : "reject" }),
            });

            if (res.ok) {
                if (accept) {
                    setMessages([]);
                    toast("Cleared", "Chat cleared.");
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

    const studentName = students.find(s => s.id === selectedStudent)?.name || "Student";

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-indigo-400" />
                Student Chats
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Chat with your assigned students</p>

            <div className="mt-4 flex gap-4 flex-col md:flex-row">
                <div className="md:w-48 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0">
                    {students.map(s => (
                        <button
                            key={s.id}
                            onClick={() => loadStudentChat(s.id)}
                            className={`whitespace-nowrap text-left rounded-xl px-3 py-2.5 text-sm transition ${selectedStudent === s.id ? "bg-indigo-500/10 border border-indigo-500/20 text-white" : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"}`}
                        >
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 shrink-0" />
                                <span className="truncate">{s.name}</span>
                            </div>
                        </button>
                    ))}
                    {students.length === 0 && <div className="text-xs text-zinc-500 p-2">No students assigned</div>}
                </div>

                <Card className="flex-1 bg-zinc-900/40 backdrop-blur-xl">
                    <CardContent className="p-0">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <div className="text-sm font-medium">{studentName}</div>
                            {conversationId && messages.length > 0 && !clearPending && (
                                <Button variant="soft" onClick={requestClearChat} className="text-xs gap-1 text-rose-400">
                                    <Trash2 className="w-3 h-3" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {clearPending && !clearRequestedByMe && (
                            <div className="mx-4 mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                                <p className="text-sm text-amber-200">Student has requested to clear this chat.</p>
                                <div className="mt-2 flex gap-2">
                                    <Button onClick={() => respondClearChat(true)} className="text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30">
                                        Accept & Clear
                                    </Button>
                                    <Button variant="soft" onClick={() => respondClearChat(false)} className="text-xs">
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        )}

                        {clearPending && clearRequestedByMe && (
                            <div className="mx-4 mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                                Waiting for student to accept clear request...
                            </div>
                        )}

                        <div className="h-[50vh] overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                                    {selectedStudent ? "No messages yet. Send the first message to start the chat." : "No students assigned."}
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
                                <Input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={`Message ${studentName}...`}
                                    disabled={sending || !selectedStudent}
                                    className="flex-1 text-sm"
                                    maxLength={2000}
                                />
                                <Button type="submit" disabled={sending || !input.trim() || !selectedStudent} className="px-3">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
