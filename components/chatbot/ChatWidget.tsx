/**
 * ChatWidget.tsx — Widget chatbot IA flottant
 *
 * Ce composant affiche une bulle cliquable en bas à droite de toutes les pages
 * publiques. Un clic ouvre une fenêtre de conversation avec l'IA de SHIFT UP.
 *
 * Fonctionnement global :
 *  1. Au chargement de la page, le composant initialise une session chatbot
 *     via GET /api/chat?page=<url_courante>.
 *  2. L'utilisateur envoie un message → POST /api/chat avec l'historique complet.
 *  3. La réponse de l'IA est ajoutée à la liste des messages.
 *
 * ⚠️  RÈGLE REACT IMPORTANTE — ordre des hooks :
 *   React exige que tous les hooks (useState, useEffect) soient appelés dans
 *   le même ordre à chaque render, SANS jamais les placer après un `return`
 *   conditionnel. La variable `isDashboard` est donc calculée AVANT les hooks,
 *   et les `return null` conditionnels se trouvent APRÈS tous les hooks.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ChatMessage } from "@/types";

// ── Message d'accueil affiché dès l'ouverture du widget ──────────────────────
const INITIAL_MESSAGE: ChatMessage = {
  id: "0",
  role: "assistant",
  content: "Bonjour ! Je suis l'assistant IA de SHIFT UP. Comment puis-je vous aider aujourd'hui ? Découvrez nos services ou posez-moi vos questions !",
  timestamp: new Date(),
};

// ── Suggestions de questions rapides affichées les premières fois ─────────────
const QUICK_REPLIES = [
  "Quels sont vos services ?",
  "Quels sont vos tarifs ?",
  "Comment prendre RDV ?",
  "Comment m'inscrire ?",
];

export default function ChatWidget() {
  // ── États locaux ───────────────────────────────────────────────────────────
  const [open, setOpen]           = useState(false);                            // fenêtre ouverte/fermée
  const [messages, setMessages]   = useState<ChatMessage[]>([INITIAL_MESSAGE]); // historique de la conversation
  const [input, setInput]         = useState("");                               // texte saisi par l'utilisateur
  const [loading, setLoading]     = useState(false);                            // requête IA en cours
  const [sessionId, setSessionId] = useState<string | null>(null);             // identifiant de session (pour historiser en DB)
  const [unread, setUnread]       = useState(0);                               // compteur de messages non lus (badge rouge)

  const messagesEndRef = useRef<HTMLDivElement>(null); // référence sur le dernier message pour le scroll auto
  const pathname       = usePathname();                // URL courante (ex : "/services", "/blog/...")

  /**
   * isDashboard — déterminé AVANT les hooks.
   * Si l'URL commence par /dashboard, le widget ne doit pas s'afficher :
   * les utilisateurs connectés ont leur propre interface de messagerie.
   * Cette variable est utilisée à l'intérieur des useEffect ET comme guard
   * pour le return null final — toujours calculée avant tout hook.
   */
  const isDashboard = pathname.startsWith("/dashboard");

  /**
   * useEffect 1 — Scroll automatique vers le dernier message.
   * Se déclenche chaque fois que `messages` change (nouveau message envoyé
   * ou reçu). Ignoré sur les pages dashboard pour ne pas déclencher
   * d'effets de bord inutiles.
   */
  useEffect(() => {
    if (isDashboard) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isDashboard]);

  /**
   * useEffect 2 — Initialisation de session chatbot.
   */
  useEffect(() => {
    if (isDashboard) return;
    fetch(`/api/chat?page=${encodeURIComponent(pathname)}`)
      .then((r) => r.json())
      .then((d) => setSessionId(d.sessionId))
      .catch(() => {});
  }, [pathname, isDashboard]);

  /**
   * useEffect 3 — Écoute l'événement custom "shiftup:open-chat"
   * émis par la page /services quand l'utilisateur clique "Parler à l'assistant".
   * Ouvre automatiquement le widget et envoie le message pré-rempli.
   */
  useEffect(() => {
    if (isDashboard) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setOpen(true);
      setUnread(0);
      if (detail?.message?.trim()) {
        // Petit délai pour que le widget soit visible avant d'envoyer
        setTimeout(() => {
          sendMessage(detail.message!);
        }, 300);
      }
    };
    window.addEventListener("shiftup:open-chat", handler);
    return () => window.removeEventListener("shiftup:open-chat", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDashboard]);

  // ── Guard de rendu — placé APRÈS tous les hooks (règle React) ─────────────
  // Le widget est invisible sur toutes les pages /dashboard/**
  if (isDashboard) return null;

  /**
   * sendMessage — Envoie un message au backend et récupère la réponse IA.
   * @param text  Le texte du message à envoyer (peut venir du champ input
   *              ou d'un clic sur une réponse rapide).
   *
   * Flux :
   *  1. Crée un objet ChatMessage "user" et l'ajoute à l'historique local.
   *  2. Envoie POST /api/chat avec l'historique complet + sessionId + page.
   *  3. Crée un objet ChatMessage "assistant" avec la réponse et l'ajoute.
   *  4. Si le widget est fermé, incrémente le badge "non lus".
   *  5. En cas d'erreur réseau : affiche un message de secours avec le n° tél.
   */
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return; // ignore les envois vides ou si déjà en cours

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput(""); // vide le champ de saisie immédiatement
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,     // identifiant de session pour persistance en DB
          page: pathname, // contexte de page pour l'IA
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Je ne peux pas répondre pour le moment.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Si la fenêtre est fermée, incrémenter le badge de non-lus
      if (!open) setUnread((u) => u + 1);
    } catch {
      // Erreur réseau — affiche un message de secours avec le numéro de téléphone
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Contactez-nous directement au (+229) 01 95 03 50 99.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleOpen — Ouvre la fenêtre et remet à zéro le compteur de non-lus.
   * L'utilisateur a vu les messages, donc le badge disparaît.
   */
  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  // ── Rendu JSX ──────────────────────────────────────────────────────────────
  return (
    <div id="chat-widget">
      {/* ── Fenêtre de conversation (visible uniquement si open=true) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            style={{ maxHeight: "520px" }}
          >
            {/* En-tête de la fenêtre de chat */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center">
                  <i className="fas fa-robot text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Assistant SHIFT UP</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                    <span className="text-white/50 text-xs">En ligne maintenant</span>
                  </div>
                </div>
              </div>
              {/* Bouton fermer */}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer l'assistant"
                className="text-white/60 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                <i className="fas fa-xmark" />
              </button>
            </div>

            {/* Zone de messages scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar robot affiché uniquement pour les messages IA */}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center flex-shrink-0 mt-auto mr-2">
                      <i className="fas fa-robot text-white text-xs" />
                    </div>
                  )}
                  {/* Bulle de message : bleue à droite (user) ou blanche à gauche (IA) */}
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-accent text-white rounded-tr-sm"
                        : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Indicateur "en train d'écrire" (trois points animés) */}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center mr-2">
                    <i className="fas fa-robot text-white text-xs" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-accent/40 rounded-full"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ancre invisible pour le scroll automatique vers le bas */}
              <div ref={messagesEndRef} />
            </div>

            {/* Réponses rapides — affichées seulement au début (≤ 2 messages) */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 border-t border-gray-100">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="bg-accent/10 text-accent text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-accent/20 transition-colors flex-shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Zone de saisie + bouton envoi */}
            <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)} // Entrée = envoi
                placeholder="Votre question..."
                className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-accent/20 transition-all"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                aria-label="Envoyer le message"
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
              >
                <i className="fas fa-paper-plane text-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bouton flottant (bulle) ── */}
      {/* Affiche l'icône chat ou close selon l'état, et le badge de non-lus */}
      <motion.button
        onClick={handleOpen}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant SHIFT UP"}
        aria-expanded={open}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-br from-accent to-secondary rounded-2xl shadow-glow flex items-center justify-center text-white relative"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.i key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }} className="fas fa-xmark text-xl" />
          ) : (
            <motion.i key="chat" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} className="fas fa-comment-dots text-xl" />
          )}
        </AnimatePresence>

        {/* Badge rouge "non lus" — visible uniquement si fenêtre fermée et messages non vus */}
        {unread > 0 && !open && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unread}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
