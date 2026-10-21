"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Status = "loading" | "disabled" | "setup" | "enabled";

export default function SecuritePage() {
  const [status, setStatus] = useState<Status>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => setStatus(d.user?.totpEnabled ? "enabled" : "disabled"))
      .catch(() => setStatus("disabled"));
  }, []);

  async function startSetup() {
    setSubmitting(true);
    const res = await fetch("/api/auth/2fa/setup");
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast.error(data.error); return; }
    setQrCode(data.qrCode);
    setSecret(data.secret);
    setStatus("setup");
  }

  async function confirmSetup() {
    if (code.replace(/\s/g, "").length !== 6) {
      toast.error("Le code doit faire 6 chiffres.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("2FA activé avec succès !");
    setStatus("enabled");
    setCode("");
    setQrCode("");
    setSecret("");
  }

  async function disable2FA() {
    if (code.replace(/\s/g, "").length !== 6) {
      toast.error("Saisissez votre code 2FA pour confirmer la désactivation.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/2fa/setup", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("2FA désactivé.");
    setStatus("disabled");
    setCode("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-syne font-black text-2xl text-primary mb-1">Sécurité du compte</h1>
      <p className="text-gray-400 text-sm mb-8">Authentification à deux facteurs (2FA)</p>

      {status === "loading" && (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {status === "enabled" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-check text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-primary">2FA activé</p>
              <p className="text-xs text-gray-400">Votre compte est protégé par une application d'authentification.</p>
            </div>
          </div>
          <hr className="border-gray-100" />
          <p className="text-sm text-gray-500">Pour désactiver le 2FA, saisissez votre code actuel :</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123 456"
              maxLength={7}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-red-400"
            />
            <button
              onClick={disable2FA}
              disabled={submitting}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? <i className="fas fa-spinner fa-spin" /> : "Désactiver"}
            </button>
          </div>
        </motion.div>
      )}

      {status === "disabled" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-halved text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-primary">2FA non activé</p>
              <p className="text-xs text-gray-400">Renforcez la sécurité de votre compte avec une application comme Google Authenticator.</p>
            </div>
          </div>
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p className="font-medium text-accent">Comment ça fonctionne :</p>
            <p>1. Activez le 2FA ci-dessous</p>
            <p>2. Scannez le QR code avec Google Authenticator, Authy, ou une app compatible</p>
            <p>3. À chaque connexion, saisissez le code à 6 chiffres généré par l'app</p>
          </div>
          <button
            onClick={startSetup}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-shield-check" /> Activer le 2FA</>}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {status === "setup" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-qrcode text-accent" />
              </div>
              <div>
                <p className="font-semibold text-primary">Configurer l'application</p>
                <p className="text-xs text-gray-400">Scannez le QR code puis confirmez avec un code</p>
              </div>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-inner">
                  <Image src={qrCode} alt="QR Code 2FA" width={160} height={160} className="rounded-lg" />
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Secret manuel (si vous ne pouvez pas scanner) :</p>
              <p className="font-mono text-xs text-primary break-all select-all">{secret}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Saisissez le code affiché dans votre application
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123 456"
                maxLength={7}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStatus("disabled"); setCode(""); setQrCode(""); setSecret(""); }}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmSetup}
                disabled={submitting || code.length < 6}
                className="flex-1 bg-gradient-to-r from-accent to-primary text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? <i className="fas fa-spinner fa-spin" /> : "Confirmer et activer"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
