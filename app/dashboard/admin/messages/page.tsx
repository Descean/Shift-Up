"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Msg {
  id: string;
  from: string;
  initials: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  isRead: boolean;
  isFromTeam: boolean;
  senderId?: string;
  senderName?: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Msg | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        const msgs: Msg[] = data.messages ?? [];
        setMessages(msgs);
        if (msgs.length > 0) setSelected(msgs[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  function selectMessage(msg: Msg) {
    setSelected(msg);
    if (!msg.isRead) {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: true } : m));
      fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id }),
      });
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selected.senderId,
          subject: `Re: ${selected.subject}`,
          content: reply,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Réponse envoyée !");
      setReply("");
    } catch {
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Messages clients</h1>
        <p className="text-gray-500 text-sm">
          {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : "Tous les messages lus"}
        </p>
      </motion.div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-envelope text-gray-300 text-2xl" />
          </div>
          <p className="text-gray-400 text-sm">Aucun message client pour l'instant.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: "480px" }}>
          <div className="grid grid-cols-3 h-full">
            {/* Liste */}
            <div className="border-r border-gray-100 overflow-y-auto">
              {messages.map((msg) => (
                <button key={msg.id} onClick={() => selectMessage(msg)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? "bg-accent/5 border-l-4 border-l-accent" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {msg.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${!msg.isRead ? "font-bold text-primary" : "font-medium text-gray-600"}`}>{msg.from}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{msg.date}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${!msg.isRead ? "text-primary font-semibold" : "text-gray-500"}`}>{msg.subject}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{msg.preview}</p>
                    </div>
                    {!msg.isRead && <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Détail */}
            <div className="col-span-2 flex flex-col">
              {selected ? (
                <>
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="font-syne font-bold text-lg text-primary mb-1">{selected.subject}</h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>De : <strong className="text-primary">{selected.from}</strong></span>
                      <span>·</span>
                      <span>{selected.date}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex gap-3 mb-6">
                      <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {selected.initials}
                      </div>
                      <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-700 leading-relaxed max-w-lg">
                        {selected.content}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <input type="text" placeholder="Répondre au client..." value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendReply()}
                        className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                      <button disabled={!reply.trim() || sending} onClick={sendReply}
                        className="w-11 h-11 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                        <i className="fas fa-paper-plane text-sm" />
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
