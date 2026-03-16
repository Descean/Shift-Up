"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

/**
 * Schéma de validation Zod du formulaire de contact.
 *
 * ─── CONFORMITÉ Code du Numérique béninois (Art. 72) ─────────────────────────
 * Le champ `consentData` est obligatoire :
 *   → L'utilisateur doit explicitement cocher la case pour consentir
 *     au traitement de ses données dans le cadre de sa demande de contact.
 *   → La case n'est pas pré-cochée (refine v === true).
 *   → Le formulaire affiche un lien vers la Politique de Confidentialité.
 *
 * Base légale du traitement des données de contact :
 *   → Consentement (Art. 72 CDN) pour les messages généraux.
 *   → Intérêt légitime (Art. 73 CDN) pour les demandes de devis
 *     (nécessaire à l'exécution d'un pré-contrat).
 */
const schema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Objet requis"),
  service: z.string().optional(),
  message: z.string().min(20, "Message trop court (min 20 caractères)"),
  // Consentement explicite requis — case non pré-cochée (Art. 72 CDN)
  consentData: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter le traitement de vos données pour envoyer ce message.",
  }),
});

type FormData = z.infer<typeof schema>;

const services = [
  "Conseil Stratégique",
  "Solutions Numériques",
  "Formation & Coaching",
  "Marketing Digital",
  "Juridique & Fiscal",
  "Finance & Comptabilité",
  "Autre",
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Message envoyé ! Nous vous répondrons dans les 24h.");
        reset();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erreur d'envoi. Réessayez ou contactez-nous directement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <i className="fas fa-envelope" />
              Parlons de votre projet
            </span>
            <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
              Contactez <span className="gradient-text">SHIFT UP</span>
            </h1>
            <p className="text-white/60 text-xl">
              Notre équipe vous répond dans les 24h ouvrées. Premier RDV de diagnostic offert.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              {[
                {
                  icon: "fas fa-map-marker-alt",
                  title: "Adresse",
                  lines: ["Abomey-Calavi, Atlantique", "République du Bénin"],
                  color: "from-blue-500 to-accent",
                },
                {
                  icon: "fas fa-phone",
                  title: "Téléphone",
                  lines: ["(+229) 01 95 03 50 99"],
                  href: "tel:+22901950350999",
                  color: "from-secondary to-teal-400",
                },
                {
                  icon: "fas fa-envelope",
                  title: "Email",
                  lines: ["shiftup.eudes@gmail.com"],
                  href: "mailto:shiftup.eudes@gmail.com",
                  color: "from-purple-500 to-accent",
                },
                {
                  icon: "fas fa-clock",
                  title: "Horaires",
                  lines: ["Lun – Ven : 8h – 18h", "Sam : 9h – 13h"],
                  color: "from-orange-400 to-yellow-400",
                },
              ].map((c) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-4 bg-white p-5 rounded-2xl shadow-card"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${c.color} rounded-xl flex items-center justify-center flex-shrink-0 text-white`}>
                    <i className={c.icon} />
                  </div>
                  <div>
                    <p className="font-semibold text-primary mb-1">{c.title}</p>
                    {c.lines.map((l) =>
                      c.href ? (
                        <a key={l} href={c.href} className="block text-gray-500 text-sm hover:text-accent transition-colors">
                          {l}
                        </a>
                      ) : (
                        <p key={l} className="text-gray-500 text-sm">{l}</p>
                      )
                    )}
                  </div>
                </motion.div>
              ))}

              {/* WhatsApp */}
              <a
                href="https://wa.me/22901950350999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-green-500 p-5 rounded-2xl text-white hover:bg-green-600 transition-colors"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fab fa-whatsapp text-2xl" />
                </div>
                <div>
                  <p className="font-bold">WhatsApp Business</p>
                  <p className="text-white/80 text-sm">Message instantané disponible</p>
                </div>
                <i className="fas fa-arrow-right ml-auto" />
              </a>

              {/* Calendly */}
              <a
                href="/contact#formulaire"
                className="flex items-center gap-4 bg-accent p-5 rounded-2xl text-white hover:bg-accent/90 transition-colors"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-xl" />
                </div>
                <div>
                  <p className="font-bold">Réserver un RDV</p>
                  <p className="text-white/80 text-sm">Diagnostic gratuit en ligne</p>
                </div>
                <i className="fas fa-arrow-right ml-auto" />
              </a>
            </div>

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 bg-white rounded-3xl shadow-card p-8"
            >
              <h2 className="font-syne font-bold text-2xl text-primary mb-2">Envoyez-nous un message</h2>
              <p className="text-gray-500 text-sm mb-6">Réponse garantie sous 24h ouvrées</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                    <input
                      {...register("name")}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                      placeholder="Jean Dupont"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                      placeholder="vous@exemple.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      {...register("phone")}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                      placeholder="+229 01 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service concerné</label>
                    <select
                      {...register("service")}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors bg-white"
                    >
                      <option value="">Sélectionner...</option>
                      {services.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objet *</label>
                  <input
                    {...register("subject")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="Sujet de votre message"
                  />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    {...register("message")}
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                    placeholder="Décrivez votre projet ou votre besoin..."
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                </div>

                {/*
                 * ── Case de consentement explicite ────────────────────────
                 * Obligatoire selon l'Article 72 du Code du Numérique béninois.
                 * La case N'EST PAS pré-cochée (valeur par défaut: false).
                 * L'utilisateur doit cocher activement pour donner son consentement.
                 *
                 * Finalité du traitement : répondre à votre demande de contact,
                 * vous rappeler si besoin, vous envoyer un devis.
                 * Durée de conservation : 3 ans après le dernier contact.
                 */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    {...register("consentData")}
                    type="checkbox"
                    defaultChecked={false}
                    className="mt-0.5 w-4 h-4 rounded text-accent border-gray-300 focus:ring-accent flex-shrink-0"
                  />
                  <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    J'accepte que SHIFT UP traite mes données personnelles (nom, email, message)
                    dans le but de répondre à ma demande.{" "}
                    <a href="/confidentialite" className="text-accent hover:underline font-medium">
                      Politique de confidentialité →
                    </a>
                  </span>
                </label>
                {errors.consentData && (
                  <p className="text-red-500 text-xs -mt-2 flex items-center gap-1">
                    <i className="fas fa-circle-exclamation text-xs" />
                    {errors.consentData.message}
                  </p>
                )}

                <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
                  {loading ? "Envoi en cours..." : "Envoyer le message"}
                  {!loading && <i className="fas fa-paper-plane" />}
                </Button>

                {/* Mention légale récapitulative sous le bouton */}
                <p className="text-xs text-gray-400 text-center">
                  <i className="fas fa-lock mr-1" />
                  Vos données sont traitées conformément au{" "}
                  <strong>Code du Numérique béninois (Loi n°2017-20)</strong>.{" "}
                  DPO : <a href="mailto:dpo@shiftup.bj" className="text-accent hover:underline">dpo@shiftup.bj</a>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
