/**
 * lib/ratelimit.ts — Limitation du nombre de requêtes (anti-abus)
 *
 * Production : compteur partagé dans Upstash Redis (API REST, offre gratuite), pour que toutes
 * les instances Vercel voient le même compteur. Variables acceptées :
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   (console Upstash)
 *   KV_REST_API_URL / KV_REST_API_TOKEN                 (intégration Upstash de Vercel)
 * Sans ces variables (ou si Upstash ne répond pas), repli sur un compteur en mémoire.
 *
 * Fenêtre fixe : INCR + PEXPIRE NX (posée au premier appel de la fenêtre).
 */

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export type RateLimitResult = { allowed: boolean; retryAfter: number };

function memoire(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (store.size > 10_000) for (const [k, e] of store) if (now >= e.resetAt) store.delete(k);
  const entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit) return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

async function redis(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const k = `rl:${key}`;
  const r = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", k], ["PEXPIRE", k, String(windowMs), "NX"], ["PTTL", k]]),
    cache: "no-store",
    signal: AbortSignal.timeout(1500),
  });
  if (!r.ok) throw new Error(`Upstash ${r.status}`);
  const [inc, , ttl] = (await r.json()) as { result?: number; error?: string }[];
  if (inc?.error || typeof inc?.result !== "number") throw new Error(inc?.error ?? "réponse Upstash invalide");
  const count = inc.result;
  const pttl = typeof ttl?.result === "number" && ttl.result > 0 ? ttl.result : windowMs;
  return count > limit ? { allowed: false, retryAfter: Math.ceil(pttl / 1000) } : { allowed: true, retryAfter: 0 };
}

export async function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }): Promise<RateLimitResult> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      return await redis(key, limit, windowMs);
    } catch (e) {
      console.error("[ratelimit] Upstash indisponible, repli mémoire :", (e as Error).message);
    }
  }
  return memoire(key, limit, windowMs);
}

export function getClientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
