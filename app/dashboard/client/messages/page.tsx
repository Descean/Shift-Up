/**
 * app/dashboard/client/messages/page.tsx — Messagerie interne (client)
 *
 * Affiche les messages échangés avec l'équipe SHIFT UP.
 * Les données sont chargées via GET /api/messages (à créer si nécessaire).
 * Actuellement : interface statique avec données mock — à brancher sur l'API.
 */

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

// Messages mock — remplacer par fetch /api/messages en production
const mockMessages = [
  {
    id: "1",
    from: "Équipe SHIFT UP",
    initials: "SU",
    subject: "Démarrage de votre projet Application Web",
    preview: "Bonjour ! Nous avons bien reçu votre demande. Votre chef de projet...",
    content: "Bonjour ! Nous avons bien reçu votre demande et sommes ravis de démarrer votre projet. Votre chef de projet, Arnaud, prendra contact avec vous dans les 24h pour planifier la réunion de lancement.",
    date: "12/11/2025",
    isRead: true,
    isFromTeam: true,
  },
  {
    id: "2",
    from: "Équipe SHIFT UP",
    initials: "SU",
    subject: "Maquettes prêtes — validation requise",
    preview: "Les maquettes de votre application sont disponibles. Merci de les valider...",
    content: "Les maquettes UI/UX de votre application sont disponibles sur le lien partagé. Merci de les consulter et de nous faire part de vos retours avant le 20/11 afin de maintenir le planning prévu.",
    date: "18/11/2025",
    isRead: false,
    isFromTeam: true,
  },
  {
    id: "3",
    from: "Équipe SHIFT UP",
    initials: "SU",
    subject: "Rappel — Solde de 60% à régler",
    preview: "Votre prestation approche de sa livraison finale. Pour finaliser...",
    content: "Votre prestation approche de sa livraison finale. Conformément à nos CGV, le solde de 60% (900 000 FCFA) est à régler avant la livraison définitive. Vous pouvez effectuer le paiement directement depuis votre espace client.",
    date: "25/11/2025",
    isRead: false,
    isFromTeam: true,
  },
];

export default function MessagesPage() {
  const [selected, setSelected] = useState(mockMessages[0]);
  const [composing, setComposing] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const unreadCount = mockMessages.filter(m => !m.isRead).length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Messages</h1>
          <p className="text-gray-500 text-sm">
            {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : "Tous les messages lus"}
          </p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-pen" />
          Nouveau message
        </button>
      </motion.div>

      {/* Layout messagerie */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: "480px" }}>
        <div className="grid grid-cols-3 h-full">

          {/* Liste des messages (panneau gauche) */}
          <div className="border-r border-gray-100 overflow-y-auto">
            {mockMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelected(msg)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selected.id === msg.id ? "bg-accent/5 border-l-4 border-l-accent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar équipe */}
                  <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {msg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${!msg.isRead ? "font-bold text-primary" : "font-medium text-gray-600"}`}>
                        {msg.from}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{msg.date}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${!msg.isRead ? "text-primary font-semibold" : "text-gray-500"}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{msg.preview}</p>
                  </div>
                  {/* Point non lu */}
                  {!msg.isRead && (
                    <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Détail du message sélectionné (panneau droit) */}
          <div className="col-span-2 flex flex-col">
            {!composing ? (
              <>
                {/* En-tête du message */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="font-syne font-bold text-lg text-primary mb-1">{selected.subject}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>De : <strong className="text-primary">{selected.from}</strong></span>
                    <span>·</span>
                    <span>{selected.date}</span>
                  </div>
                </div>

                {/* Corps du message */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-2xl">
                    {/* Bulle de message de l'équipe */}
                    <div className="flex gap-3 mb-6">
                      <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        SU
                      </div>
                      <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-700 leading-relaxed max-w-lg">
                        {selected.content}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone de réponse */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Répondre à ce message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                    <button
                      disabled={!newMessage.trim()}
                      onClick={() => { toast.success("Réponse envoyée !"); setNewMessage(""); }}
                      className="w-11 h-11 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      <i className="fas fa-paper-plane text-sm" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Formulaire de nouveau message */
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-syne font-bold text-lg text-primary">Nouveau message</h2>
                  <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-xmark text-lg" />
                  </button>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
                    <input
                      type="text"
                      value="Équipe SHIFT UP"
                      readOnly
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
                    <input
                      type="text"
                      placeholder="Objet de votre message..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      rows={8}
                      placeholder="Votre message..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                    />
                  </div>
                  <button onClick={() => { toast.success("Message envoyé à l'équipe SHIFT UP !"); setComposing(false); }} className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                    <i className="fas fa-paper-plane mr-2" />
                    Envoyer le message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
