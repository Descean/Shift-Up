"use client";

import { useEffect, useState, useRef } from "react";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  static?: boolean;
}

/**
 * La vraie valeur est rendue côté serveur (moteurs de recherche, aperçus de liens) ;
 * l'animation ne démarre que dans le navigateur, quand le compteur devient visible.
 */
function Counter({ value, suffix, fixe }: { value: number; suffix: string; fixe?: boolean }) {
  const [count, setCount] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || fixe || value <= 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 45;
          let i = 0;
          setCount(0);
          timer = setInterval(() => {
            i++;
            if (i >= steps) { setCount(value); clearInterval(timer); }
            else setCount(Math.round((value * i) / steps));
          }, 1500 / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); if (timer) clearInterval(timer); };
  }, [value, fixe]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function CounterDisplay({ stats }: { stats: StatItem[] }) {
  return (
    <div className={`grid grid-cols-2 ${stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3 max-w-4xl" : "max-w-2xl"} mx-auto divide-x divide-primary/10`}>
      {stats.map((c) => (
        <div key={c.label} className="text-center px-6 py-6 lg:py-0">
          <p className="text-4xl sm:text-5xl font-bold text-primary mb-2 tabular-nums" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
            <Counter value={c.value} suffix={c.suffix} fixe={c.static} />
          </p>
          <p className="text-primary/65 text-sm">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
