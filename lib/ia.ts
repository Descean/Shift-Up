/**
 * lib/ia.ts — Réponses rédigées par une IA (facultatif).
 *
 * Actif si l'une de ces clés est définie sur Vercel :
 *  - GROQ_API_KEY      (Groq, modèle IA_MODELE_GROQ, par défaut llama-3.3-70b-versatile — offre gratuite)
 *  - ANTHROPIC_API_KEY (Claude, modèle IA_MODELE_CLAUDE, par défaut claude-haiku-5-5)
 * Sans clé, l'assistant WhatsApp fonctionne avec son menu et passe la main à l'équipe.
 */

export const iaDisponible = () => Boolean(process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY);

type Tour = { role: "user" | "assistant"; content: string };

export async function repondreIA(systeme: string, historique: Tour[]): Promise<string | null> {
  try {
    if (process.env.GROQ_API_KEY) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.IA_MODELE_GROQ ?? "llama-3.3-70b-versatile", temperature: 0.3, max_tokens: 500, messages: [{ role: "system", content: systeme }, ...historique] }),
        signal: AbortSignal.timeout(20000),
      });
      const d = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
      if (r.ok && d.choices?.[0]?.message?.content) return d.choices[0].message.content.trim();
      console.error("[ia] groq", r.status);
    }
    if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.IA_MODELE_CLAUDE ?? "claude-haiku-5-5", max_tokens: 500, system: systeme, messages: historique }),
        signal: AbortSignal.timeout(20000),
      });
      const d = (await r.json().catch(() => ({}))) as { content?: { type: string; text?: string }[] };
      const texte = d.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
      if (r.ok && texte) return texte;
      console.error("[ia] claude", r.status);
    }
  } catch (e) {
    console.error("[ia]", e);
  }
  return null;
}
