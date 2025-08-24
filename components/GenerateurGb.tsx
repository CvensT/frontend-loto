"use client";

import { useMemo, useState } from "react";

type Props = { loterieId: "1" | "2" | "3" };

type Combinaison = {
  bloc: number;
  combinaison: number[];
  etoile: boolean;
};

type ApiSuccess = {
  ok: true;
  data: Combinaison[];
  echo?: { loterie: string; blocs: number };
  source?: string;
};
type ApiError = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = ApiSuccess | ApiError;

/* ---------- Config loteries ---------- */
const CFG = {
  "1": { name: "Grande Vie", baseCount: 9 },
  "2": { name: "Lotto Max",  baseCount: 7 },
  "3": { name: "Lotto 6/49", baseCount: 8 },
} as const;

const LOT_NAMES: Record<Props["loterieId"], string> = {
  "1": CFG["1"].name,
  "2": CFG["2"].name,
  "3": CFG["3"].name,
};

const fmtComb = (nums: number[]) => nums.map(n => String(n).padStart(2, "0")).join(" ");
const fmtList = (nums: number[]) => nums.map(n => String(n).padStart(2, "0")).join(", ");

/* ---------- Synthèse ---------- */
function summarizeBlock(base: number[][], star?: number[]) {
  const counts = new Map<number, number>();
  for (const c of base) for (const n of c) counts.set(n, (counts.get(n) || 0) + 1);
  const doublons = [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n).sort((a, b) => a - b);

  const baseSet = new Set<number>(base.flat());
  const reutilises = (star ?? []).filter(n => baseSet.has(n)).sort((a, b) => a - b);
  const nouveaux  = (star ?? []).filter(n => !baseSet.has(n)).sort((a, b) => a - b);

  return { doublons, reutilises, nouveaux };
}

/* ---------- Groupement robuste ---------- */
function groupCombinaisons(
  data: Combinaison[],
  requestedBlocs: number,
  baseCount: number
): { blocNo: number; base: number[][]; star?: number[] }[] {
  if (!data?.length) return [];

  // 1) Essai par numéro de bloc (si >= 2 distincts)
  const byBloc = new Map<number, { base: number[][]; stars: number[][] }>();
  for (const item of data) {
    const key = Number.isFinite(item.bloc) && item.bloc > 0 ? item.bloc : 1;
    const entry = byBloc.get(key) ?? { base: [], stars: [] };
    (item.etoile ? entry.stars : entry.base).push(item.combinaison);
    byBloc.set(key, entry);
  }
  const distinct = [...byBloc.keys()].sort((a, b) => a - b);
  if (distinct.length >= 2) {
    return distinct.map(k => ({
      blocNo: k,
      base: byBloc.get(k)!.base,
      star: byBloc.get(k)!.stars[0],
    }));
  }

  // 2) Découpe séquentielle — on forme un bloc dès qu'on a baseCount bases;
  //    on prend la prochaine étoile si elle vient juste après, sinon bloc sans étoile.
  const out: { blocNo: number; base: number[][]; star?: number[] }[] = [];
  let i = 0, blocNo = 1;
  while (i < data.length) {
    const base: number[][] = [];
    // collecter baseCount lignes de base (en sautant les étoiles)
    while (i < data.length && base.length < baseCount) {
      if (!data[i].etoile) base.push(data[i].combinaison);
      i++;
    }

    // regarder si la prochaine ligne est une étoile (liée à ce bloc)
    let star: number[] | undefined;
    if (i < data.length && data[i].etoile) {
      star = data[i].combinaison;
      i++;
    }

    if (base.length > 0 || star) {
      out.push({ blocNo: blocNo++, base, star });
    } else {
      // anti-boucle si bruit
      i++;
    }
  }

  // Si malgré tout on a 1 seul bloc mais l'utilisateur en demande plusieurs,
  // on ne "casse" pas arbitrairement : on laisse 1 bloc (source ne fournit
  // probablement pas assez de lignes pour plus d'un bloc).
  return out;
}

/* ======================== Composant ======================== */
export default function GenerateurGb({ loterieId }: Props) {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [nbBlocs, setNbBlocs]   = useState(1);

  const loterieName = LOT_NAMES[loterieId];
  const baseCount   = CFG[loterieId].baseCount;

  const generer = async () => {
    setLoading(true);
    setErr(null);
    setResultat(null);
    try {
      const blocs = Math.max(1, Math.min(30, nbBlocs));
      const r = await fetch("/api/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loterie: loterieId,
          mode: "Gb",
          blocs,          // formats tolérés par le backend
          nBlocs: blocs,
          n_blocs: blocs,
        }),
      });
      const json: ApiResponse = await r.json();
      setResultat(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    if (!resultat || !("ok" in resultat) || !resultat.ok) return [];
    const buckets = groupCombinaisons(resultat.data, nbBlocs, baseCount);
    return buckets.map(({ blocNo, base, star }) => {
      const { doublons, reutilises, nouveaux } = summarizeBlock(base, star);
      const lines = base.map(c => fmtComb(c)).join("\n") + (star ? `\n${fmtComb(star)} ★` : "");
      return { blocNo, lines, doublons, reutilises, nouveaux };
    });
  }, [resultat, nbBlocs, baseCount]);

  return (
    <div className="border rounded-lg p-2 sm:p-3 space-y-2 text-[13px] w-fit max-w-full mx-auto">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[13px]">
          Gb — Génération par blocs couvrants (+ étoile) / {loterieName}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <label className="whitespace-nowrap">Nombre de blocs</label>
        <input
          type="number"
          min={1}
          max={30}
          value={nbBlocs}
          onChange={(e) => setNbBlocs(Math.max(1, Math.min(30, parseInt(e.target.value || "1", 10))))}
          className="w-20 rounded-lg border px-2 py-1 text-center"
        />
        <button onClick={generer} disabled={loading} className="rounded-lg px-2.5 py-1.5 border text-[12px] disabled:opacity-60">
          {loading ? "Génération..." : "Générer"}
        </button>
        <button onClick={() => { setResultat(null); setErr(null); }} className="rounded-lg px-2.5 py-1.5 border text-[12px]">
          Réinitialiser
        </button>
      </div>

      {err && <pre className="text-red-600 text-[12px] whitespace-pre-wrap w-fit">{err}</pre>}

      {resultat !== null && "ok" in resultat && resultat.ok && resultat.echo && (
        <div className="text-[12px] text-gray-600 w-fit">
          {resultat.echo.loterie} — {resultat.echo.blocs} blocs générés ({resultat.data.length} combis)
        </div>
      )}

      {resultat !== null && "ok" in resultat && resultat.ok && (
  <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-2">
    {grouped.map((b, idx) => {
      // petit résumé pour le header
      const resume =
        (b.reutilises.length ? `Réutilisés: ${b.reutilises.length}` : "Réutilisés: 0") +
        " · " +
        (b.nouveaux.length ? `Nouveaux: ${b.nouveaux.length}` : "Nouveaux: 0") +
        (b.doublons.length ? ` · Doublons: ${b.doublons.length}` : "");

      return (
        <details
          key={b.blocNo}
          className="group w-full border rounded-lg bg-white/70 shadow-sm"
          {...(idx === 0 ? { open: true } : {})} // ouvre le 1er bloc par défaut
        >
          <summary className="flex items-center justify-between gap-2 cursor-pointer select-none px-3 py-2 text-[12px] font-semibold">
            <span>Bloc {b.blocNo}</span>
            <span className="text-gray-600 font-normal">
              {resume}
            </span>
          </summary>

          <div className="px-3 pb-3">
            <pre className="font-mono text-[11px] leading-[1.25] bg-gray-50 border rounded p-2 whitespace-pre w-full overflow-x-auto">
{b.lines}
            </pre>

            <div className="mt-2 space-y-1 text-[11px]">
              <div>
                {b.doublons.length === 0
                  ? "👍 Aucun doublon détecté dans les combinaisons de base."
                  : `⚠️ Doublons détectés dans les combinaisons de base : [${fmtList(b.doublons)}]`}
              </div>
              <div>
                🔷 Numéros réutilisés dans la combinaison étoile : [
                {b.reutilises.length ? fmtList(b.reutilises) : "aucun"}]
              </div>
              <div>
                ⚠️ Numéros nouveaux (restants) dans la combinaison étoile : [
                {b.nouveaux.length ? fmtList(b.nouveaux) : "aucun"}]
              </div>
            </div>
          </div>
        </details>
      );
    })}
  </div>
)}

      {resultat !== null && "ok" in resultat && resultat.ok === false && (
        <pre className="text-red-600 text-[12px] whitespace-pre-wrap w-fit">{resultat.error}</pre>
      )}
    </div>
  );
}
