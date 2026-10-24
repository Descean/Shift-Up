"use client";

import { useEffect, useState } from "react";

interface Temoignage { id: string; name: string; role: string; company: string | null; content: string; isVisible: boolean; date: string }

const vide = { name: "", role: "", company: "", content: "" };

export default function TemoignagesAdminPage() {
  const [liste, setListe] = useState<Temoignage[]>([]);
  const [form, setForm] = useState(vide);
  const [accord, setAccord] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    const r = await fetch("/api/admin/temoignages");
    if (r.ok) setListe((await r.json()).temoignages);
  };
  useEffect(() => { charger(); }, []);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault(); setErreur("");
    const r = await fetch("/api/admin/temoignages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, isVisible: true }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErreur(d.error ?? "Enregistrement impossible."); return; }
    setForm(vide); setAccord(false); charger();
  }
  async function basculer(t: Temoignage) {
    await fetch("/api/admin/temoignages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, isVisible: !t.isVisible }) });
    charger();
  }
  async function supprimer(t: Temoignage) {
    if (!confirm(`Supprimer le témoignage de ${t.name} ?`)) return;
    await fetch(`/api/admin/temoignages?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
    charger();
  }

  const champ = (k: keyof typeof vide, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`t-${k}`} className="text-sm font-semibold text-primary">{label}</label>
      {k === "content"
        ? <textarea id={`t-${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} rows={4} className="mt-1 w-full p-3 rounded-xl border border-gray-300 text-sm text-primary" {...props} />
        : <input id={`t-${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-primary" {...props} />}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary mb-1">Témoignages clients</h1>
        <p className="text-sm text-gray-500">Affichés sur la page d&apos;accueil (les 3 plus récents visibles). Sans témoignage visible, l&apos;accueil présente nos engagements.</p>
      </div>

      <form onSubmit={ajouter} className="bg-white rounded-2xl border border-gray-200 p-6 grid sm:grid-cols-2 gap-4">
        {champ("name", "Nom du client", { required: true, maxLength: 80 })}
        {champ("role", "Fonction", { required: true, maxLength: 120, placeholder: "Directeur général" })}
        {champ("company", "Entreprise (facultatif)", { maxLength: 120 })}
        <div className="sm:col-span-2">{champ("content", "Témoignage (tel que rédigé ou validé par le client)", { required: true, minLength: 20, maxLength: 600 })}</div>
        <label className="sm:col-span-2 flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-1 w-4 h-4 accent-[#0A2533]" />
          J&apos;ai l&apos;accord écrit du client pour publier ce témoignage avec son nom.
        </label>
        {erreur && <p className="sm:col-span-2 text-sm text-red-700" role="alert">{erreur}</p>}
        <div className="sm:col-span-2">
          <button disabled={!accord} className="min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent disabled:opacity-50">Publier</button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {liste.length === 0 && <p className="p-6 text-sm text-gray-500 text-center">Aucun témoignage enregistré.</p>}
        {liste.map((t) => (
          <div key={t.id} className="p-5 flex flex-wrap gap-4 items-start">
            <div className="flex-1 min-w-[240px]">
              <p className="text-sm text-primary italic leading-relaxed">&ldquo;{t.content}&rdquo;</p>
              <p className="text-xs text-gray-500 mt-1">{t.name} — {t.role}{t.company ? `, ${t.company}` : ""} · {new Date(t.date).toLocaleDateString("fr-FR")}</p>
            </div>
            <button onClick={() => basculer(t)} className={`min-h-[40px] px-3 rounded-full text-xs font-semibold border ${t.isVisible ? "bg-green-50 text-green-800 border-green-200" : "bg-white text-gray-600 border-gray-300"}`}>
              {t.isVisible ? "Visible" : "Masqué"}
            </button>
            <button onClick={() => supprimer(t)} className="min-h-[40px] px-3 rounded-xl text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-50">Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
