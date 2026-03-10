"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

const counters = [
  { value: 120, suffix: "+", label: "Clients satisfaits", icon: "fas fa-users" },
  { value: 98, suffix: "%", label: "Taux de satisfaction", icon: "fas fa-star" },
  { value: 6, suffix: "", label: "Domaines d'expertise", icon: "fas fa-briefcase" },
  { value: 3, suffix: " ans", label: "D'expérience prouvée", icon: "fas fa-calendar-check" },
];

function Counter({ value, suffix, delay = 0 }: { value: number; suffix: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, value, delay]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function CountersSection() {
  return (
    <section className="py-16 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle at 25px 25px, rgba(30,159,212,0.8) 2px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-white/50 text-sm uppercase tracking-widest font-medium">
            SHIFT UP en chiffres
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {counters.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-accent/40 group-hover:bg-accent/10 transition-all duration-300">
                <i className={`${c.icon} text-accent text-2xl`} />
              </div>
              <div className="font-syne font-black text-4xl sm:text-5xl text-white mb-2">
                <Counter value={c.value} suffix={c.suffix} delay={i * 200} />
              </div>
              <p className="text-white/50 text-sm">{c.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
