"use client";

export default function BoutonCookies() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("shiftup:cookies"))}
      className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent">
      <i className="fas fa-sliders" aria-hidden /> Modifier mes choix
    </button>
  );
}
