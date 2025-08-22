import { NextResponse } from "next/server";
const API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  if (!API) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_API_URL manquante" },
      { status: 500 }
    );
  }

  const payload = await req.json().catch(() => ({}));
  const r = await fetch(`${API}/api/verifier`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await r.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: r.status });
  } catch {
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
