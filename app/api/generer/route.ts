import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ou: export const revalidate = 0;

const API = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

function ensureApi(): string {
  if (!API) throw new Error("BACKEND_API_URL (ou NEXT_PUBLIC_API_URL) manquante");
  return API.replace(/\/+$/, ""); // retire slash final
}

export async function GET() {
  return NextResponse.json({ ok: true, from: "Next.js /api/generer" });
}

export async function POST(req: Request) {
  try {
    const base = ensureApi();

    const payload = await req.json().catch(() => ({}));
    const body = Object.keys(payload).length
      ? payload
      : { loterie: "2", mode: "Gb", blocs: 1 };

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000); // 15s timeout

    const r = await fetch(`${base}/api/generer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
  } catch (e: unknown) {
  const msg =
    e instanceof Error
      ? (e.name === "AbortError" ? "Timeout backend" : e.message)
      : "Erreur inconnue";
  return NextResponse.json({ ok: false, error: msg }, { status: 502 });
}
}
