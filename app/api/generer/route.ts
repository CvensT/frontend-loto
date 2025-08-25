// app/api/generer/route.ts
import { NextResponse } from "next/server";

const API =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.API_URL ||
  "";

function pickNbBlocs(body: any): number {
  const v =
    Number(body?.nb_blocs) ||
    Number(body?.n_blocs) ||
    Number(body?.nBlocs) ||
    Number(body?.blocs) ||
    Number(body?.nb) ||
    Number(body?.n) ||
    1;
  return Math.max(1, Math.min(30, v));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) || {};
    const loterie = String(body.loterie ?? body.loterieId ?? "");
    const nbBloc = pickNbBlocs(body);
    const mode = String(body.mode ?? "Gb");

    if (!API) {
      return NextResponse.json(
        { ok: false, error: "BACKEND_URL manquante" },
        { status: 500 }
      );
    }
    if (!loterie) {
      return NextResponse.json(
        { ok: false, error: "Paramètre 'loterie' manquant" },
        { status: 400 }
      );
    }

    // Essais tolérants (selon ce que le backend attend)
    const payloads = [
      { loterie, mode, nb_blocs: nbBloc },
      { loterie, mode, n_blocs: nbBloc },
      { loterie, mode, blocs: nbBloc },
    ];

    const urls = [`${API}/generer`, `${API}/gb`];

    let lastText = "Erreur inconnue";
    let lastStatus = 500;

    for (const url of urls) {
      for (const p of payloads) {
        const r = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(p),
        });
        const txt = await r.text();
        lastText = txt;
        lastStatus = r.status;
        // si succès → on renvoie tel quel
        if (r.ok) {
          try {
            return NextResponse.json(JSON.parse(txt));
          } catch {
            return new NextResponse(txt, { status: 200 });
          }
        }
        // si l’erreur est “bloc manquant”, on essaie la variante suivante
      }
    }

    // Rien n’a marché
    try {
      const j = JSON.parse(lastText);
      return NextResponse.json(j, { status: lastStatus });
    } catch {
      return new NextResponse(lastText, { status: lastStatus });
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

