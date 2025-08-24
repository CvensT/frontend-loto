import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
const base = () => {
  if (!API) throw new Error("BACKEND_API_URL (ou NEXT_PUBLIC_API_URL) manquante");
  return API.replace(/\/+$/, "");
};

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

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json().catch(() => ({}));
    const body = isRecord(rawBody) ? rawBody : {};

    // attend { loterie: "1"|"2"|"3", combinaison: number[] }
    const loterie = getStringField(body, "loterie", "2");
    const combinaison = getNumberArray(body, "combinaison");

    const r = await fetchWithTimeout(
      `${base()}/api/verifier`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // snake_case pour Flask
        body: JSON.stringify({ loterie, combinaison }),
      },
      30_000
    );

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
