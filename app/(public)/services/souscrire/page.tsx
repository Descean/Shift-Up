"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const servicesList = [
  { id: "conseil", label: "Conseil Stratégique" },
  { id: "numerique", label: "Solutions Numériques" },
  { id: "formation", label: "Formation & Coaching" },
  { id: "marketing", label: "Marketing Digital" },
  { id: "juridique", label: "Juridique & Fiscal" },
  { id: "finance", label: "Finance & Comptabilité" },
  { id: "montage-dossier", label: "Montage de Dossier" },
];

const steps = [
  { icon: "fa-file-alt", label: "Votre demande", desc: "Décrivez votre besoin" },
  { icon: "fa-calculator", label: "Devis sous 48h", desc: "Nous préparons votre offre" },
  { icon: "fa-hand-holding-usd", label: "Acompte 60%", desc: "Validation & démarrage" },
  { icon: "fa-rocket", label: "Prestation", desc: "Réalisation de votre projet" },
  { icon: "fa-flag-checkered", label: "Livraison & solde", desc: "40% restants à la livraison" },
];

function SubscriptionForm() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedService = searchParams.get("service") || "";

  const [form, setForm] = useState({
    service: preselectedService,
    name: (session?.user as { name?: string })?.name || "",
    email: (session?.user as { email?: string })?.email || "",
    phone: "",
    company: "",
    budget: "",
    description: "",
    timeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service || !form.description) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: `Demande de prestation : ${form.service}`,
          service: form.service,
          message: `${form.description}\n\nBudget : ${form.budget || "Non précisé"}\nDélai souhaité : ${form.timeline || "Non précisé"}\nEntreprise : ${form.company || "Non précisée"}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        if (session) {
          setTimeout(() => router.push("/dashboard/client/prestations"), 3000);
        }
      } else {
        toast.error("Une erreur est survenue. Réessayez ou contactez-nous directement.");
      }
    } catch {
      toast.error("Impossible d'envoyer votre demande. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-6"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check text-green-600 text-3xl" />
        </div>
        <h2 className="font-syne font-black text-2xl text-primary mb-3">Demande envoyée !</h2>
        <p className="text-gray-500 text-lg mb-4">
          Notre équipe vous contactera sous <strong>48 heures</strong> ouvrables avec votre devis personnalisé.
        </p>
        {session && (
          <p className="text-sm text-gray-400">Redirection vers votre tableau de bord…</p>
        )}
        <div className="mt-8 flex gap-4 justify-center">
          {session ? (
            <Link href="/dashboard/client" className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors">
              Mon espace client
            </Link>
          ) : (
            <Link href="/" className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors">
              Retour à l'accueil
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Service */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Service souhaité <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
        >
          <option value="">Sélectionnez un service…</option>
          {servicesList.map((s) => (
            <option key={s.id} value={s.label}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jean Dupont"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          />
        </div>
        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemple.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Téléphone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+229 01 97 00 00 00"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          />
        </div>
        {/* Company */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Entreprise / Organisation</label>
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Nom de votre structure"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Budget */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Budget estimé</label>
          <select
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          >
            <option value="">Sélectionner…</option>
            <option>Moins de 100 000 F</option>
            <option>100 000 – 300 000 F</option>
            <option>300 000 – 500 000 F</option>
            <option>500 000 – 1 000 000 F</option>
            <option>Plus de 1 000 000 F</option>
            <option>À définir avec vous</option>
          </select>
        </div>
        {/* Timeline */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Délai souhaité</label>
          <select
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          >
            <option value="">Sélectionner…</option>
            <option>Urgent (moins de 2 semaines)</option>
            <option>Dans le mois</option>
            <option>Dans 1 à 3 mois</option>
            <option>Plus de 3 mois</option>
            <option>Pas encore défini</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Décrivez votre besoin <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Expliquez votre projet, vos objectifs, vos contraintes spécifiques…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none resize-none"
        />
      </div>

      {!session && (
        <div className="bg-accent/5 rounded-xl p-4 text-sm text-gray-600">
          <i className="fas fa-user-plus text-accent mr-2" />
          Vous n'avez pas de compte ? <Link href="/inscription" className="text-accent font-semibold hover:underline">Créez-en un</Link> pour suivre votre demande dans votre espace client.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3.5 rounded-xl font-syne font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane" />
            Envoyer ma demande
          </>
        )}
      </button>
    </form>
  );
}

export default function SouscrirePage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-12">
        <div className="container-custom">
          <div className="max-w-2xl">
            <Link href="/services" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
              <i className="fas fa-arrow-left" /> Retour aux services
            </Link>
            <h1 className="font-syne font-black text-3xl sm:text-4xl text-white mb-3">
              Démarrez votre projet
            </h1>
            <p className="text-white/60 text-lg">
              Décrivez votre besoin, nous vous revenons sous 48h avec un devis sur mesure.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 bg-white rounded-2xl shadow-card p-8"
            >
              <h2 className="font-syne font-bold text-primary text-xl mb-6">Votre demande</h2>
              <Suspense>
                <SubscriptionForm />
              </Suspense>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-syne font-bold text-primary mb-5">Comment ça se passe ?</h3>
                <div className="space-y-4">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className={`fas ${step.icon} text-accent text-xs`} />
                        </div>
                        {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-semibold text-primary">{step.label}</p>
                        <p className="text-xs text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-accent/5 rounded-2xl p-5">
                <p className="font-syne font-bold text-primary mb-1">Besoin d'un appel d'abord ?</p>
                <p className="text-sm text-gray-500 mb-3">Réservez un créneau gratuit de 30 min avec notre équipe.</p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <i className="fas fa-calendar-check" />
                  Réserver un appel gratuit
                </a>
              </div>

              <div className="bg-white rounded-2xl shadow-card p-5 text-sm text-gray-500">
                <p className="font-semibold text-primary mb-2"><i className="fas fa-shield-alt text-accent mr-2" />Vos données sont sécurisées</p>
                <p>Toutes vos informations sont traitées de façon confidentielle et ne sont jamais partagées avec des tiers.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
