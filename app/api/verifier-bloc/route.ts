import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
function baseUrl(): string {
  if (!API) throw new Error("BACKEND_API_URL (ou NEXT_PUBLIC_API_URL) manquante");
  return API.replace(/\/+$/, "");
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

/* ==================== Helpers ==================== */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(typeof e === "string" ? e : JSON.stringify(e));
}
function getStringField(obj: Record<string, unknown>, key: string, fallback: string): string {
  const v = obj[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}
function getNumberArray(obj: Record<string, unknown>, key: string): number[] {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  const out: number[] = [];
  for (const x of v) {
    const n = typeof x === "number" ? x : (typeof x === "string" ? Number(x) : NaN);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}
function getOptionalNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const base = baseUrl();
    const raw: unknown = await req.json().catch(() => ({}));
    const payload = isRecord(raw) ? raw : {};

    // ---- mapping payload (snake_case attendu par Flask)
    const loterie = getStringField(payload, "loterie", "2");
    const bloc = getNumberArray(payload, "bloc");
    const etoile_index = getOptionalNumber(payload, "etoileIndex");

    // 1) Réveil backend (non bloquant) - 5s max
    try {
      await fetchWithTimeout(`${base}/health`, { method: "GET" }, 5_000);
    } catch {
      /* ignore */
    }

    // 2) Premier essai (20s) — suffisant en chaud
    const body = JSON.stringify({ loterie, bloc, etoile_index });
    let r = await fetchWithTimeout(
      `${base}/api/verifier-bloc`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      },
      20_000
    );

    // 3) Si timeout/502/504 → retry unique (60s) pour cold-start Render
    if (!r.ok && [502, 503, 504].includes(r.status)) {
      r = await fetchWithTimeout(
        `${base}/api/verifier-bloc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
        60_000
      );
    }

    const txt = await r.text();
    try {
      return NextResponse.json(JSON.parse(txt), { status: r.status });
    } catch {
      return new NextResponse(txt, {
        status: r.status,
        headers: { "Content-Type": r.headers.get("content-type") || "text/plain" },
      });
    }
  } catch (e: unknown) {
    const err = toError(e);
    const msg = err.name === "AbortError" ? "Timeout backend" : (err.message || "Erreur inconnue");
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
