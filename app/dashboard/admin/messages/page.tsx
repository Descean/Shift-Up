"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Contact {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
}

interface ThreadMsg {
  id: string;
  content: string;
  subject: string | null;
  isMine: boolean;
  senderName: string;
  date: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AdminMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  async function loadContacts() {
    setLoading(true);
    try {
      const r = await fetch("/api/messages");
      const data = await r.json();
      const convs: Contact[] = data.conversations ?? [];
      setContacts(convs);
      if (convs.length > 0) selectContact(convs[0]);
    } finally {
      setLoading(false);
    }
  }

  async function selectContact(c: Contact) {
    setSelected(c);
    setThreadLoading(true);
    try {
      const r = await fetch(`/api/messages?thread=${c.id}`);
      const data = await r.json();
      setThread(data.messages ?? []);
      setContacts((prev) => prev.map((x) => x.id === c.id ? { ...x, unread: 0 } : x));
    } finally {
      setThreadLoading(false);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply, recipientId: selected.id }),
      });
      if (res.ok) {
        const optimistic: ThreadMsg = {
          id: Date.now().toString(),
          content: reply,
          subject: null,
          isMine: true,
          senderName: "Moi",
          date: new Date().toISOString(),
        };
        setThread((prev) => [...prev, optimistic]);
        setReply("");
        await loadContacts();
      } else {
        toast.error("Erreur lors de l'envoi.");
      }
    } finally {
      setSending(false);
    }
  }

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Messages clients</h1>
        <p className="text-gray-500 text-sm">{totalUnread > 0 ? `${totalUnread} message(s) non lu(s)` : "Toutes les conversations"}</p>
      </motion.div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <i className="fas fa-envelope text-3xl text-gray-200 block mb-3" />
          <p className="text-gray-400 text-sm">Aucun message client pour l'instant.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          <div className="flex h-full">

            {/* ── Contacts ── */}
            <div className={`border-r border-gray-100 flex flex-col ${selected ? "hidden sm:flex sm:w-72 lg:w-80" : "flex w-full sm:w-72 lg:w-80"}`}>
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Clients ({contacts.length})</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.map((c) => (
                  <button key={c.id} onClick={() => selectContact(c)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3 ${selected?.id === c.id ? "bg-accent/5 border-l-4 border-l-accent" : ""}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${c.unread > 0 ? "font-bold text-primary" : "font-medium text-gray-700"}`}>{c.name}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(c.lastDate)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Thread ── */}
            <div className={`flex-1 flex flex-col min-w-0 ${!selected ? "hidden sm:flex" : "flex"}`}>
              {selected ? (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setSelected(null)} className="sm:hidden text-gray-400 hover:text-gray-600 mr-1">
                      <i className="fas fa-arrow-left" />
                    </button>
                    <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials(selected.name)}
                    </div>
                    <div>
                      <p className="font-syne font-bold text-primary text-sm">{selected.name}</p>
                      <p className="text-xs text-gray-400">Client</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {threadLoading ? (
                      <div className="flex justify-center py-10">
                        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : thread.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-10">Aucun message.</div>
                    ) : thread.map((m) => (
                      <div key={m.id} className={`flex gap-2 ${m.isMine ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${m.isMine ? "bg-secondary" : "bg-gradient-to-br from-accent to-secondary"}`}>
                          {m.isMine ? "M" : initials(m.senderName)}
                        </div>
                        <div className={`max-w-[75%] flex flex-col gap-1 ${m.isMine ? "items-end" : "items-start"}`}>
                          {m.subject && <p className="text-[10px] text-gray-400 px-1">{m.subject}</p>}
                          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.isMine ? "bg-secondary text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                            {m.content}
                          </div>
                          <p className="text-[10px] text-gray-400 px-1">{formatDate(m.date)}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Reply input */}
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex gap-2 items-end">
                      <textarea
                        rows={2}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                        placeholder={`Répondre à ${selected.name}… (Entrée pour envoyer)`}
                        className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                      />
                      <button onClick={sendReply} disabled={!reply.trim() || sending}
                        className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 flex-shrink-0">
                        {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-paper-plane text-sm" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <i className="fas fa-comment-dots text-4xl" />
                  <p className="text-sm">Sélectionnez un client</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
