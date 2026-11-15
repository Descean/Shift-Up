"use client";
/** Cloche de notifications de l'espace : nombre de nouvelles non lues et liste des derniers avis. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Avis = { id: string; titre: string; texte: string | null; lien: string | null; lu: boolean; createdAt: string };

export default function Cloche({ sombre = false }: { sombre?: boolean }) {
  const router = useRouter();
  const [avis, setAvis] = useState<Avis[]>([]);
  const [nonLus, setNonLus] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  const charger = useCallback(async () => {
    const r = await fetch("/api/notifications").catch(() => null);
    if (!r?.ok) return;
    const d = await r.json();
    setAvis(d.avis ?? []);
    setNonLus(d.nonLus ?? 0);
  }, []);

  useEffect(() => {
    let actif = true;
    const tour = () => { if (actif) void charger(); };
    tour();
    const t = setInterval(tour, 60_000);
    return () => { actif = false; clearInterval(t); };
  }, [charger]);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => { if (!boite.current?.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);

  async function ouvrir(a: Avis) {
    setOuvert(false);
    if (!a.lu) {
      setAvis((l) => l.map((x) => (x.id === a.id ? { ...x, lu: true } : x)));
      setNonLus((n) => Math.max(0, n - 1));
      void fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
    }
    if (a.lien) router.push(a.lien);
  }

  async function toutLu() {
    setAvis((l) => l.map((x) => ({ ...x, lu: true })));
    setNonLus(0);
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
  }

  return (
    <div ref={boite} className="relative">
      <button onClick={() => setOuvert((o) => !o)} aria-label={`Notifications${nonLus ? ` (${nonLus} non lues)` : ""}`} aria-expanded={ouvert}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${sombre ? "border-white/15 bg-white/10 text-white" : "border-su-lavande bg-su-brume text-su-bleu hover:border-su-bleu"}`}>
        <i className="fas fa-bell text-sm" />
        {nonLus > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-su-ciel px-1 text-[10px] font-bold text-su-nuit">
            {nonLus > 9 ? "9+" : nonLus}
          </span>
        )}
      </button>
      {ouvert && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-su-lavande bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-su-lavande px-4 py-3">
            <span className="text-sm font-bold text-su-nuit">Notifications</span>
            {nonLus > 0 && <button onClick={toutLu} className="text-xs font-semibold text-su-bleu">Tout marquer comme lu</button>}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {avis.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">Aucune notification pour le moment.</li>
            ) : avis.map((a) => (
              <li key={a.id}>
                <button onClick={() => ouvrir(a)} className={`block w-full px-4 py-3 text-left hover:bg-su-brume ${a.lu ? "" : "bg-su-brume/60"}`}>
                  <span className="flex items-start gap-2">
                    {!a.lu && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-su-bleu" />}
                    <span className="min-w-0">
                      <span className={`block text-sm ${a.lu ? "text-gray-700" : "font-semibold text-su-nuit"}`}>{a.titre}</span>
                      {a.texte && <span className="block line-clamp-2 text-xs text-gray-500">{a.texte}</span>}
                      <span className="block text-[11px] text-gray-400">{new Date(a.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
