"use client";
/**
 * Accord du client pour recevoir les notifications SHIFT UP sur WhatsApp.
 */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function NotificationsWhatsApp({ compact = false }: { compact?: boolean }) {
  const [etat, setEtat] = useState<{ whatsapp: boolean; numero: string; indisponible?: boolean } | null>(null);
  const [numero, setNumero] = useState("");
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences").then((r) => r.json()).then((d) => { setEtat(d); setNumero(d.numero ?? ""); }).catch(() => setEtat({ whatsapp: false, numero: "", indisponible: true }));
  }, []);

  async function enregistrer(whatsapp: boolean) {
    setOccupe(true);
    try {
      const r = await fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ whatsapp, numero }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Enregistrement impossible."); return; }
      setEtat({ whatsapp: d.whatsapp, numero: d.numero ?? numero });
      if (d.numero) setNumero(d.numero);
      toast.success(d.message);
    } catch { toast.error("Erreur réseau."); }
    finally { setOccupe(false); }
  }

  if (!etat || etat.indisponible) return null;
  return (
    <div className={`border border-gray-100 rounded-2xl ${compact ? "p-4" : "p-5"} space-y-3 bg-white`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0"><i className="fab fa-whatsapp text-lg" /></div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Notifications WhatsApp {etat.whatsapp && <span className="ml-1 text-[11px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5">activées</span>}</p>
          <p className="text-xs text-gray-500 mt-0.5">Recevez aussi sur WhatsApp les messages importants : devis, pièces à fournir, dépôt, résultat, nouveaux avis de votre veille. Vous pouvez arrêter à tout moment.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={numero} onChange={(e) => setNumero(e.target.value)} inputMode="tel" aria-label="Numéro WhatsApp" placeholder="Numéro WhatsApp (ex. 01 97 00 00 00)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent" />
        {etat.whatsapp ? (
          <div className="flex gap-2">
            <button disabled={occupe} onClick={() => enregistrer(true)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Mettre à jour</button>
            <button disabled={occupe} onClick={() => enregistrer(false)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">Désactiver</button>
          </div>
        ) : (
          <button disabled={occupe || numero.trim().length < 8} onClick={() => enregistrer(true)} className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
            J&apos;accepte de recevoir des messages WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
