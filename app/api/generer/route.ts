import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE;

function baseUrl() {
  if (!API) throw new Error("BACKEND_API_URL / NEXT_PUBLIC_API_URL / NEXT_PUBLIC_API_BASE manquante");
  return API.replace(/\/+$/, "");
}

type Probe = { url: string; method: "POST" | "GET"; status?: number; snippet?: string };

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

/* ==================== Helpers de typage sûrs ==================== */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error(typeof e === "string" ? e : JSON.stringify(e));
}

function getStringField(obj: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
  }
  return fallback;
}

function getNumberField(obj: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

/* JSON parse tolérant (accepte pseudo‑JSON Python ou renvoie un wrapper) */
function smartParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }
  if (/<!doctype html>|<html/i.test(raw)) {
    return { ok: false, error: "Réponse HTML du backend (404/500 probable)" };
  }
  const cooked = raw
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/(['"])?([A-Za-z0-9_]+)\1\s*:/g, (_m, _q, k) => `"${k}":`)
    .replace(/'/g, '"');
  try {
    return JSON.parse(cooked);
  } catch {
    // retourne un wrapper brut
  }
  return { ok: true, data: raw };
}

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json().catch(() => ({}));
    const bodyIn = isRecord(rawBody) ? rawBody : {};

    // Normalisation des paramètres entrants
    const loterie = getStringField(bodyIn, ["loterie", "loterieId"], "2");
    const blocsNum = getNumberField(bodyIn, ["blocs", "nBlocs", "n_blocs"], 1);
    const mode = getStringField(bodyIn, ["mode"], "Gb");

    const b = baseUrl();

    // Corps envoyé au backend — ce que la plupart des APIs attendent
    const normalizedBody = { loterie, mode, blocs: blocsNum };

    const postInit: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedBody),
    };

    // Couvre les variations d'URL backend
    const bases = [
      `${b}/api/generer-blocs`,
      `${b}/api/generer_blocs`,
      `${b}/api/generer`,
      `${b}/api/gb`,
      `${b}/generer-blocs`,
      `${b}/generer_blocs`,
      `${b}/generer`,
      `${b}/gb`,
    ];

    const probes: Probe[] = [];

    for (const url of bases) {
      // 1) POST
      try {
        const r = await fetchWithTimeout(url, postInit, 45_000);
        const txt = await r.text();
        if (r.ok) {
          const payload: unknown = smartParse(txt);
          return NextResponse.json(payload as unknown, { status: r.status });
        }
        probes.push({ url, method: "POST", status: r.status, snippet: txt.slice(0, 300) });

        // 2) GET fallback si 404/405
        if (r.status === 404 || r.status === 405) {
          const qs = new URLSearchParams({
            loterie,
            mode,
            blocs: String(blocsNum),
          });
          const getUrl = `${url}?${qs.toString()}`;
          const r2 = await fetchWithTimeout(getUrl, { method: "GET" }, 45_000);
          const txt2 = await r2.text();
          if (r2.ok) {
            const payload2: unknown = smartParse(txt2);
            return NextResponse.json(payload2 as unknown, { status: r2.status });
          }
          probes.push({ url: getUrl, method: "GET", status: r2.status, snippet: txt2.slice(0, 300) });
        }
      } catch (e: unknown) {
        const err = toError(e);
        probes.push({ url, method: "POST", snippet: String(err.message).slice(0, 300) });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Aucun endpoint de génération n’a répondu avec succès (POST/GET).",
        tried: probes,
        hint:
          "Vérifie l’URL BACKEND_API_URL/NEXT_PUBLIC_API_URL/NEXT_PUBLIC_API_BASE et le chemin réel sur le backend, ex: /api/generer-blocs.",
      },
      { status: 502 }
    );
  } catch (e: unknown) {
    const err = toError(e);
    const msg = err.name === "AbortError" ? "Timeout backend" : (err.message || "Erreur inconnue");
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
