import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const API = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

function ensureApi(): string {
  if (!API) throw new Error("BACKEND_API_URL (ou NEXT_PUBLIC_API_URL) manquante");
  return API.replace(/\/+$/, "");
}

export async function POST(req: Request) {
  try {
    const base = ensureApi();
    const payload = await req.json().catch(() => ({}));

    // Valeurs par défaut / validation légère
    const loterie = String(payload.loterie ?? "2");
    const combinaison = Array.isArray(payload.combinaison) ? payload.combinaison : [];

    if (combinaison.length === 0) {
      return NextResponse.json({ ok: false, error: "combinaison manquante" }, { status: 400 });
    }

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);

    const r = await fetch(`${base}/api/verifier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loterie, combinaison }),
      cache: "no-store",
      signal: ac.signal,
    }).finally(() => clearTimeout(t));

    const txt = await r.text();
    try {
      return NextResponse.json(JSON.parse(txt), { status: r.status });
    } catch {
      return new NextResponse(txt, {
        status: r.status,
        headers: { "Content-Type": r.headers.get("Content-Type") || "text/plain" },
      });
    }
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Timeout backend" : e?.message || "Erreur inconnue";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
