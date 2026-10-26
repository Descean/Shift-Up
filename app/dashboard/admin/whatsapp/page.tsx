"use client";
/**
 * Administration — Boîte de réception WhatsApp (assistant + réponses de l'équipe).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type Message = { id: string; sens: string; auteur: string; texte: string; statut: string | null; createdAt: string };
type Conversation = {
  id: string; numero: string; nom: string | null; userId: string | null; humainJusquau: string | null; dernierRecuLe: string | null; nonLus: number; dernierMessageLe: string;
  dernier?: Message | null; client?: { name: string | null; email: string } | null;
};
type Config = { automatique: boolean; webhook: boolean; signature: boolean; ia: boolean; urlWebhook: string };

const heure = (d: string) => new Date(d).toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const enMain = (c: Conversation) => Boolean(c.humainJusquau && new Date(c.humainJusquau) > new Date());
const fenetreOuverte = (c: Conversation) => Boolean(c.dernierRecuLe && Date.now() - new Date(c.dernierRecuLe).getTime() < 24 * 3600_000);
const ICONES: Record<string, string> = { sent: "fa-check", delivered: "fa-check-double", read: "fa-check-double text-sky-500", failed: "fa-triangle-exclamation text-red-500" };

export default function WhatsAppAdminPage() {
  const [liste, setListe] = useState<Conversation[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [indispo, setIndispo] = useState(false);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [conv, setConv] = useState<Conversation & { client?: { name: string | null; email: string } | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState("");
  const [occupe, setOccupe] = useState(false);
  const bas = useRef<HTMLDivElement>(null);

  const chargerListe = useCallback(() => fetch("/api/admin/whatsapp").then((r) => r.json()).then((d) => { setListe(d.conversations ?? []); setConfig(d.config ?? null); setIndispo(Boolean(d.indisponible)); }).catch(() => {}), []);
  const chargerConv = useCallback((id: string) => fetch(`/api/admin/whatsapp?id=${id}`).then((r) => r.json()).then((d) => { if (d.conversation) { setConv(d.conversation); setMessages(d.messages ?? []); } }).catch(() => {}), []);

  useEffect(() => { chargerListe(); const t = setInterval(chargerListe, 15000); return () => clearInterval(t); }, [chargerListe]);
  useEffect(() => { if (!choisie) return; chargerConv(choisie); const t = setInterval(() => chargerConv(choisie), 10000); return () => clearInterval(t); }, [choisie, chargerConv]);
  useEffect(() => { bas.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function agir(corps: Record<string, unknown>) {
    setOccupe(true);
    try {
      const r = await fetch("/api/admin/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Action impossible.", { duration: 7000 }); return false; }
      toast.success(d.message ?? "C'est fait.");
      if (choisie) await chargerConv(choisie);
      chargerListe();
      return true;
    } catch { toast.error("Erreur réseau."); return false; }
    finally { setOccupe(false); }
  }

  const nomDe = (c: Conversation) => c.client?.name ?? c.nom ?? `+${c.numero}`;

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary"><i className="fab fa-whatsapp text-green-600 mr-2" />WhatsApp</h1>
          <p className="text-gray-500 text-sm">Messages reçus sur le numéro WhatsApp de SHIFT UP. L&apos;assistant répond seul ; prenez la main quand un client a besoin d&apos;un conseiller.</p>
        </div>
        <Link href="/dashboard/admin/veille#whatsapp" className="text-xs text-accent hover:underline flex-shrink-0">Modèles et configuration →</Link>
      </div>

      {config && (!config.automatique || !config.webhook) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
          <p className="font-semibold text-sm">Pour activer l&apos;assistant</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Dans Vercel, ajoutez <code>WHATSAPP_TOKEN</code> et <code>WHATSAPP_PHONE_NUMBER_ID</code> {config.automatique ? <span className="text-green-700">(fait)</span> : ""}, puis <code>WHATSAPP_VERIFY_TOKEN</code> (un mot de passe de votre choix) et <code>WHATSAPP_APP_SECRET</code> (clé secrète de l&apos;application Meta) {config.webhook ? <span className="text-green-700">(fait)</span> : ""}. Redéployez.</li>
            <li>Dans l&apos;application Meta (WhatsApp → Configuration → Webhook) : URL de rappel <code className="bg-white px-1 rounded">{config.urlWebhook}</code>, jeton de vérification = votre <code>WHATSAPP_VERIFY_TOKEN</code>, puis abonnez-vous au champ <strong>messages</strong>.</li>
            <li>Facultatif : <code>GROQ_API_KEY</code> (gratuit) ou <code>ANTHROPIC_API_KEY</code> pour que l&apos;assistant réponde aussi aux questions libres {config.ia ? <span className="text-green-700">(actif)</span> : ""}.</li>
          </ol>
        </div>
      )}
      {indispo && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">Exécutez une fois le script <code className="bg-white px-1.5 rounded">prisma/sql/2026-10_whatsapp_conversations.sql</code> dans Supabase pour enregistrer les conversations.</div>}

      <div className="grid lg:grid-cols-[360px_1fr] gap-4 min-h-[600px]">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations ({liste.length})</div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[640px]">
            {liste.length === 0 ? <p className="p-6 text-sm text-gray-400 text-center">Aucun message reçu pour l&apos;instant.</p> : liste.map((c) => (
              <button key={c.id} onClick={() => setChoisie(c.id)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${choisie === c.id ? "bg-accent/5 border-l-4 border-accent" : "border-l-4 border-transparent"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary truncate">{nomDe(c)}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{heure(c.dernierMessageLe)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 truncate flex-1">{c.dernier ? `${c.dernier.sens === "ENVOYE" ? (c.dernier.auteur === "EQUIPE" ? "Vous : " : "Assistant : ") : ""}${c.dernier.texte}` : ""}</p>
                  {c.nonLus > 0 && <span className="bg-green-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0">{c.nonLus}</span>}
                </div>
                <div className="flex gap-1.5 mt-1">
                  {!c.userId && <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Sans compte</span>}
                  {enMain(c) && <span className="text-[10px] bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 font-semibold">Équipe</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card flex flex-col overflow-hidden">
          {!conv ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-10">Choisissez une conversation.</div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{nomDe(conv)}</p>
                  <p className="text-xs text-gray-400">+{conv.numero}{conv.client?.email ? ` · ${conv.client.email}` : " · aucun compte client lié"}</p>
                </div>
                {enMain(conv) ? (
                  <button disabled={occupe} onClick={() => agir({ action: "rendre_main", id: conv.id })} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 flex-shrink-0">Rendre la main à l&apos;assistant</button>
                ) : (
                  <button disabled={occupe} onClick={() => agir({ action: "prendre_main", id: conv.id })} className="text-xs bg-amber-500 text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-amber-600 flex-shrink-0">Prendre la main</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-[#efeae2] max-h-[560px]">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sens === "ENVOYE" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap break-words ${m.sens === "ENVOYE" ? (m.auteur === "EQUIPE" ? "bg-[#d9fdd3]" : "bg-white border border-green-100") : "bg-white"}`}>
                      {m.sens === "ENVOYE" && <p className="text-[10px] font-semibold text-green-700 mb-0.5">{m.auteur === "EQUIPE" ? "Équipe" : "Assistant"}</p>}
                      {m.texte}
                      <p className="text-[10px] text-gray-400 text-right mt-1">{heure(m.createdAt)} {m.statut && m.sens === "ENVOYE" && <i className={`fas ${ICONES[m.statut] ?? ""} ml-1`} />}</p>
                    </div>
                  </div>
                ))}
                <div ref={bas} />
              </div>
              <div className="border-t border-gray-100 p-3 space-y-1.5">
                {!fenetreOuverte(conv) && <p className="text-[11px] text-amber-700">Le client n&apos;a pas écrit depuis plus de 24 h : WhatsApp n&apos;accepte plus de message libre. Attendez qu&apos;il écrive, ou utilisez un modèle.</p>}
                <div className="flex gap-2">
                  <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Votre réponse (l'assistant se mettra en pause 24 h)" aria-label="Réponse"
                    onKeyDown={async (e) => { if (e.key === "Enter" && !e.shiftKey && texte.trim()) { e.preventDefault(); if (await agir({ action: "repondre", id: conv.id, texte })) setTexte(""); } }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
                  <button disabled={occupe || !texte.trim() || !fenetreOuverte(conv)} onClick={async () => { if (await agir({ action: "repondre", id: conv.id, texte })) setTexte(""); }}
                    className="bg-green-600 text-white rounded-xl px-4 text-sm font-semibold hover:bg-green-700 disabled:opacity-50" aria-label="Envoyer"><i className="fas fa-paper-plane" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
