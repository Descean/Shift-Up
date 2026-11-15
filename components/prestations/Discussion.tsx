"use client";
/**
 * Fil de discussion d'une demande (client ↔ équipe), affiché dans la fiche de la demande
 * côté client et dans le panneau de l'admin.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type Msg = { id: string; content: string; date: string; deMoi: boolean; auteur: string; equipe: boolean };

export default function Discussion({ prestationId, close = false }: { prestationId: string; close?: boolean }) {
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  const charger = useCallback(async () => {
    const r = await fetch(`/api/prestations/${prestationId}/messages`).catch(() => null);
    const d = r?.ok ? await r.json() : { messages: [] };
    setMessages(d.messages ?? []);
  }, [prestationId]);

  useEffect(() => {
    let actif = true;
    const tour = () => { if (actif) void charger(); };
    tour();
    const t = setInterval(tour, 30_000);
    return () => { actif = false; clearInterval(t); };
  }, [charger]);

  useEffect(() => { fin.current?.scrollIntoView({ block: "nearest" }); }, [messages?.length]);

  async function envoyer() {
    const content = texte.trim();
    if (!content) return;
    setEnvoi(true);
    try {
      const r = await fetch(`/api/prestations/${prestationId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Message non envoyé."); return; }
      setTexte("");
      await charger();
    } finally { setEnvoi(false); }
  }

  return (
    <div className="rounded-2xl border border-su-lavande bg-white">
      <div className="max-h-80 space-y-2.5 overflow-y-auto p-4">
        {messages === null ? (
          <p className="py-6 text-center text-sm text-gray-400">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Aucun message pour cette demande. Posez votre question, l&apos;équipe vous répond ici.</p>
        ) : messages.map((m) => (
          <div key={m.id} className={`flex ${m.deMoi ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.deMoi ? "bg-su-bleu text-white" : "bg-su-brume text-su-nuit"}`}>
              {!m.deMoi && <p className="mb-0.5 text-[11px] font-semibold text-su-bleu">{m.auteur}</p>}
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              <p className={`mt-1 text-[10px] ${m.deMoi ? "text-su-lavande" : "text-gray-500"}`}>
                {new Date(m.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={fin} />
      </div>
      {!close && (
        <div className="flex items-end gap-2 border-t border-su-lavande p-3">
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} maxLength={4000} aria-label="Votre message"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void envoyer(); } }}
            placeholder="Écrire un message sur cette demande…"
            className="flex-1 resize-none rounded-xl border border-su-lavande px-3 py-2 text-sm focus:border-su-bleu focus:outline-none" />
          <button onClick={envoyer} disabled={envoi || !texte.trim()}
            className="rounded-xl bg-su-bleu px-4 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet disabled:opacity-50">
            {envoi ? "…" : "Envoyer"}
          </button>
        </div>
      )}
    </div>
  );
}
