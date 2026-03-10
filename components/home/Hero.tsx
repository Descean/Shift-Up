"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const particles = Array.from({ length: 20 });

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-primary">
      {/* Animated background mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-60" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,159,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,159,212,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-1/4 left-1/6 w-72 h-72 bg-secondary/15 rounded-full blur-3xl"
      />

      {/* Floating particles */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent/40"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      <div className="container-custom relative z-10 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-6"
            >
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-accent text-sm font-medium">
                Cabinet de Conseil & Solutions Numériques — Bénin
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-syne font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-6"
            >
              Transformez{" "}
              <span className="gradient-text">votre vision</span>{" "}
              en succès réel
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/70 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl"
            >
              SHIFT UP accompagne entreprises et entrepreneurs dans leur transformation
              stratégique et digitale. Conseil expert, solutions sur mesure, résultats mesurables.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Button href="/services" variant="gradient" size="lg">
                Découvrir nos services
                <i className="fas fa-arrow-right" />
              </Button>
              <Button href="/contact" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white hover:text-primary">
                <i className="fas fa-calendar-alt" />
                Prendre RDV
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6"
            >
              {[
                { icon: "fas fa-shield-check", label: "RCCM Officiel" },
                { icon: "fas fa-star", label: "4.9/5 Satisfaction" },
                { icon: "fas fa-bolt", label: "Résultats Rapides" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <i className={`${b.icon} text-secondary text-sm`} />
                  <span className="text-white/50 text-sm">{b.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              {/* Main card */}
              <div className="glass-card p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/50 text-sm">Progression globale</p>
                    <p className="text-white font-syne font-bold text-2xl">87%</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center shadow-glow">
                    <i className="fas fa-chart-line text-white text-2xl" />
                  </div>
                </div>

                {/* Phases */}
                {[
                  { label: "Analyse & Diagnostic", pct: 100, done: true },
                  { label: "Stratégie & Plan", pct: 100, done: true },
                  { label: "Déploiement", pct: 65, done: false },
                  { label: "Optimisation", pct: 20, done: false },
                ].map((phase) => (
                  <div key={phase.label} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm flex items-center gap-2">
                        {phase.done && <i className="fas fa-check-circle text-secondary text-xs" />}
                        {phase.label}
                      </span>
                      <span className="text-white/50 text-xs">{phase.pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${phase.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating mini cards */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-6 -right-6 glass-card px-4 py-3 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-secondary text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">+120</p>
                    <p className="text-white/40 text-xs">Clients actifs</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-6 -left-6 glass-card px-4 py-3 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-trophy text-accent text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">98%</p>
                    <p className="text-white/40 text-xs">Taux succès</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-xs uppercase tracking-widest">Défiler</span>
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 bg-accent rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
