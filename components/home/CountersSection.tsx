"use client";

import { useEffect, useState, useRef } from "react";

const counters = [
  { value: 120, suffix: "+", label: "Clients satisfaits" },
  { value: 98, suffix: "%", label: "Taux de satisfaction" },
  { value: 7, suffix: "", label: "Domaines d'expertise" },
  { value: 3, suffix: " ans", label: "D'expérience prouvée" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
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
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function CountersSection() {
  return (
    <section className="bg-white border-y border-primary/10 py-14">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-primary/10">
          {counters.map((c, i) => (
            <div key={c.label} className="text-center px-6 py-6 lg:py-0">
              <p
                className="text-4xl sm:text-5xl font-bold text-primary mb-2 tabular-nums"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                <Counter value={c.value} suffix={c.suffix} />
              </p>
              <p className="text-primary/45 text-sm">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
