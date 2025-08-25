"use client";

import { useMemo, useState } from "react";

type Props = { loterieId: "1" | "2" | "3" };

type Combinaison = { bloc: number; combinaison: number[]; etoile: boolean };
type ApiSuccess = { ok: true; data: Combinaison[]; echo?: { loterie: string; blocs: number } };
type ApiError   = { ok: false; error: string };
type ApiResponse = ApiSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", baseCount: 9 },
  "2": { name: "Lotto Max",  baseCount: 7 },
  "3": { name: "Lotto 6/49", baseCount: 8 },
} as const;

const LOT_NAMES: Record<Props["loterieId"], string> = {
  "1": CFG["1"].name, "2": CFG["2"].name, "3": CFG["3"].name,
};

const fmtComb = (nums: number[]) => nums.map(n => String(n).padStart(2, "0")).join(" ");
const fmtList = (nums: number[]) => nums.map(n => String(n).padStart(2, "0")).join(", ");

async function postGb(blocs: number, loterie: string): Promise<ApiResponse> {
  const tries = [
    { loterie, mode: "Gb", nb_blocs: blocs },
    { loterie, mode: "Gb", n_blocs: blocs },
    { loterie, mode: "Gb", blocs },
  ];
  let last: string = "Erreur inconnue";
  for (const payload of tries) {
    const r = await fetch("/api/generer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const txt = await r.text();
    last = txt;
    if (r.ok) {
      try { return JSON.parse(txt) as ApiResponse; } catch { return { ok: false, error: "Réponse invalide" }; }
    }
    // si “bloc manquant”, on essaie la variante suivante
    if (/bloc\s+manquant/i.test(txt)) continue;
  }
  try { return JSON.parse(last) as ApiResponse; } catch { return { ok: false, error: last }; }
}

/* groupement et synthèse */
function summarize(base: number[][], star?: number[]) {
  const counts = new Map<number, number>();
  for (const c of base) for (const n of c) counts.set(n, (counts.get(n) || 0) + 1);
  const doublons = [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n).sort((a,b)=>a-b);
  const set = new Set(base.flat());
  const reutilises = (star ?? []).filter(n => set.has(n)).sort((a,b)=>a-b);
  const nouveaux  = (star ?? []).filter(n => !set.has(n)).sort((a,b)=>a-b);
  return { doublons, reutilises, nouveaux };
}

function groupData(data: Combinaison[], baseCount: number) {
  if (!data?.length) return [] as { blocNo: number; base: number[][]; star?: number[] }[];
  const out: { blocNo: number; base: number[][]; star?: number[] }[] = [];
  let i = 0, blocNo = 1;
  while (i < data.length) {
    const base: number[][] = [];
    while (i < data.length && base.length < baseCount) {
      if (!data[i].etoile) base.push(data[i].combinaison);
      i++;
    }
    let star: number[] | undefined;
    if (i < data.length && data[i].etoile) { star = data[i].combinaison; i++; }
    out.push({ blocNo: blocNo++, base, star });
  }
  return out;
}

export default function GenerateurGb({ loterieId }: Props) {
  const [nbBlocs, setNbBlocs] = useState(2);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Combinaison[] | null>(null);

  const loterieName = LOT_NAMES[loterieId];
  const baseCount   = CFG[loterieId].baseCount;

  async function generer() {
    setLoading(true);
    setErr(null);
    setData(null);
    const res = await postGb(Math.max(1, Math.min(30, nbBlocs)), loterieId);
    setLoading(false);
    if (!res || !("ok" in res) || !res.ok) {
      setErr((res as ApiError)?.error || "Erreur");
      return;
    }
    setData(res.data);
  }

  const grouped = useMemo(() => {
    if (!data) return [];
    return groupData(data, baseCount).map(({ blocNo, base, star }) => {
      const s = summarize(base, star);
      const lines = base.map(c => fmtComb(c)).join("\n") + (star ? `\n${fmtComb(star)} ★` : "");
      return { blocNo, lines, ...s };
    });
  }, [data, baseCount]);

  return (
    <section className="rounded-2xl border bg-white/70 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold">
          Gb — Génération par blocs couvrants (+ étoile) / {loterieName}
        </h3>

        <div className="flex items-center gap-2 text-sm">
          <label>Nombre de blocs</label>
          <input
            type="number"
            min={1}
            max={30}
            value={nbBlocs}
            onChange={(e) => setNbBlocs(Math.max(1, Math.min(30, parseInt(e.target.value || "1", 10))))}
            className="w-24 rounded-lg border px-2 py-1 text-center bg-white"
          />
          <button
            onClick={generer}
            disabled={loading}
            className="rounded-xl border px-3 py-2 text-sm bg-white hover:shadow-sm disabled:opacity-60"
          >
            {loading ? "Génération…" : "Générer"}
          </button>
        </div>
      </div>

      {err && <div className="mt-3 text-red-600 text-sm">{err}</div>}

      {data && (
        <div className="mt-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          {grouped.map((g, i) => (
            <details key={g.blocNo} className="group border rounded-xl bg-white shadow-sm" {...(i===0?{open:true}:{})}>
              <summary className="flex items-center justify-between gap-2 cursor-pointer select-none px-3 py-2 text-sm font-semibold">
                <span>Bloc {g.blocNo}</span>
                <span className="text-gray-600 font-normal">
                  Réutilisés: {g.reutilises.length} · Nouveaux: {g.nouveaux.length}
                  {g.doublons.length ? ` · Doublons: ${g.doublons.length}` : ""}
                </span>
              </summary>
              <div className="px-3 pb-3">
                <pre className="font-mono tabular-nums text-[12px] leading-[1.25] bg-gray-50 border rounded p-2 whitespace-pre inline-block">
{g.lines}
                </pre>
                <div className="mt-2 space-y-1 text-xs">
                  <div>
                    {g.doublons.length === 0
                      ? "👍 Aucun doublon détecté dans les combinaisons de base."
                      : `⚠️ Doublons détectés : [${fmtList(g.doublons)}]`}
                  </div>
                  <div>🔷 Réutilisés (étoile) : [{g.reutilises.length ? fmtList(g.reutilises) : "aucun"}]</div>
                  <div>⚠️ Nouveaux (étoile) : [{g.nouveaux.length ? fmtList(g.nouveaux) : "aucun"}]</div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
