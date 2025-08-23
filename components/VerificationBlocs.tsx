"use client";

import { useMemo, useState } from "react";

type VerifierBlocSuccess = { ok: true; data: { valide: boolean; erreurs: string[]; details: unknown } };
type ApiError           = { ok: false; error: string; [k: string]: unknown };
type ApiResponse        = VerifierBlocSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, baseCount: 9 },
  "2": { name: "Lotto Max",  numsPerComb: 7, baseCount: 7 },
  "3": { name: "Lotto 6/49", numsPerComb: 6, baseCount: 8 },
} as const;

function parseBlockText(text: string, numsPerComb: number) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const block: number[][] = [];
  for (const l of lines) {
    const nums = l
      .replace(/[;,]+/g, " ")
      .split(/\s+/)
      .map((t) => parseInt(t, 10))
      .filter((n) => Number.isFinite(n));
    if (nums.length !== numsPerComb) {
      throw new Error(`Chaque ligne doit contenir ${numsPerComb} nombres — "${l}"`);
    }
    block.push([...nums].sort((a, b) => a - b));
  }
  return block;
}

export default function VerificationBlocs({ loterieId }: { loterieId: string }) {
  const cfg = CFG[(loterieId as keyof typeof CFG) ?? "2"];
  const expectedTotal = cfg.baseCount + 1;

  const [blocText, setBlocText] = useState("");
  const [etoileIndex, setEtoileIndex] = useState(cfg.baseCount);

  const [result, setResult] = useState<ApiResponse | string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Nouveaux états pour l’analyse locale
  const [dupsBase, setDupsBase] = useState<number[] | null>(null);
  const [starReuse, setStarReuse] = useState<number[] | null>(null);
  const [starNew, setStarNew] = useState<number[] | null>(null);

  const placeholder = useMemo(() => {
    const sample: number[][] =
      loterieId === "2"
        ? [
            [3,10,15,17,24,36,47],
            [5,14,18,25,42,45,46],
            [1,2,26,27,31,38,44],
            [9,12,21,23,40,41,43],
            [4,8,13,33,35,37,39],
            [6,7,16,19,28,34,50],
            [11,20,22,29,30,48,49],
            [11,12,25,28,29,32,39] // étoile
          ]
        : Array.from({ length: expectedTotal }, () =>
            Array.from({ length: cfg.numsPerComb }, (_, i) => i + 1)
          );
    return sample.map((row) => row.join(" ")).join("\n");
  }, [loterieId]);

  const isOk = (r: ApiResponse | string | null): r is VerifierBlocSuccess =>
    !!r && typeof r !== "string" && "ok" in r && r.ok;

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    setDupsBase(null);
    setStarReuse(null);
    setStarNew(null);
    try {
      // 1) Parse + validations élémentaires
      const parsed = parseBlockText(blocText, cfg.numsPerComb);
      if (parsed.length !== expectedTotal) {
        throw new Error(`Il faut ${expectedTotal} lignes (base ${cfg.baseCount} + 1 étoile).`);
      }
      if (etoileIndex < 0 || etoileIndex >= parsed.length) {
        throw new Error(`etoileIndex doit être entre 0 et ${parsed.length - 1}.`);
      }

      // 2) Analyse locale — DOUblons dans la BASE + réutilisations étoile
      const baseIdx = parsed.map((_, i) => i).filter((i) => i !== etoileIndex);
      const counts: Record<number, number> = {};
      for (const i of baseIdx) {
        for (const n of parsed[i]) counts[n] = (counts[n] ?? 0) + 1;
      }
      const dups = Object.keys(counts)
        .map((x) => parseInt(x, 10))
        .filter((n) => counts[n] > 1)
        .sort((a, b) => a - b);
      setDupsBase(dups);

      const starSet = new Set(parsed[etoileIndex]);
      const baseSet = new Set(baseIdx.flatMap((i) => parsed[i]));
      const reused = [...starSet].filter((n) => baseSet.has(n)).sort((a, b) => a - b);
      const newInStar = [...starSet].filter((n) => !baseSet.has(n)).sort((a, b) => a - b);
      setStarReuse(reused);
      setStarNew(newInStar);

      // 3) Appel backend — renvoie aussi les CRITÈRES de V dans `details`
      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc: parsed, etoileIndex }),
        cache: "no-store",
      });
      const text = await r.text();
      try { setResult(JSON.parse(text) as ApiResponse); }
      catch { setResult(text); }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const raw = result === null ? "" : typeof result === "string" ? result : JSON.stringify(result, null, 2);

  // Table lisible des critères V pour chaque combinaison (si renvoyé par le backend)
  const table = useMemo(() => {
    if (!isOk(result)) return [];
    const details = result.data.details;
    if (!Array.isArray(details)) return [];
    return details.map((d, idx) => {
      const obj = d as Record<string, unknown>;
      const comb = obj["Combinaison"];
      const row: { idx: number; comb: number[] | null; checks: Array<[string, boolean]> } = {
        idx,
        comb:
          Array.isArray(comb) && comb.every((n) => typeof n === "number")
            ? (comb as number[])
            : null,
        checks: [],
      };
      for (const [k, v] of Object.entries(obj)) {
        if (k === "Combinaison") continue;
        if (typeof v === "boolean") row.checks.push([k, v]);
      }
      return row;
    });
  }, [result]);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Vb — Vérifier couverture de blocs (base + étoile)</h3>

      <div className="text-sm text-gray-600">
        Loterie <b>{cfg.name}</b> — {cfg.baseCount} combinaisons de base + 1 étoile.
      </div>

      <textarea
        value={blocText}
        onChange={(e) => setBlocText(e.target.value)}
        rows={Math.max(8, expectedTotal + 2)}
        placeholder={placeholder}
        className="w-full border rounded p-2 font-mono text-sm"
      />

      <div className="flex items-center gap-3">
        <label className="text-sm">Index de l’étoile</label>
        <input
          type="number"
          min={0}
          max={expectedTotal - 1}
          value={etoileIndex}
          onChange={(e) => {
            const v = parseInt(e.target.value || String(cfg.baseCount), 10);
            const clamped = Number.isFinite(v) ? Math.max(0, Math.min(expectedTotal - 1, v)) : cfg.baseCount;
            setEtoileIndex(clamped);
          }}
          className="border rounded px-2 py-1 w-24"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
        <button
          onClick={() => setShowRaw((s) => !s)}
          className="px-3 py-2 rounded-xl border text-xs ml-auto"
          disabled={result === null}
        >
          {showRaw ? "Masquer JSON" : "Voir JSON"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {/* --- Résumé Doublons base & étoile --- */}
      {dupsBase !== null && (
        <div className="rounded-xl border p-3">
          {dupsBase.length === 0 ? (
            <div className="text-green-700 font-medium">✅ Aucun doublon dans les combinaisons de base.</div>
          ) : (
            <div className="text-red-700 font-medium">
              ❌ Doublons dans la base : {dupsBase.join(", ")}
            </div>
          )}
          {starReuse !== null && starNew !== null && (
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div>🔄 Réutilisés par l’étoile : {starReuse.length ? starReuse.join(", ") : "—"}</div>
              <div>✨ Nouveaux dans l’étoile : {starNew.length ? starNew.join(", ") : "—"}</div>
            </div>
          )}
        </div>
      )}

      {/* --- Statut global renvoyé par le backend --- */}
      {isOk(result) && (
        <div
          className={`rounded-xl border p-3 ${
            result.data.valide ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
          }`}
        >
          <div className="font-semibold">
            Statut backend : {result.data.valide ? "VALIDE ✅" : "INVALIDE ❌"}
          </div>
          {!!result.data.erreurs?.length && (
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
              {result.data.erreurs.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* --- Critères de V, par combinaison --- */}
      {isOk(result) && table.length > 0 && (
        <div className="space-y-2">
          {table.map((r) => (
            <details key={r.idx} className="rounded-lg border p-2">
              <summary className="cursor-pointer text-sm">
                Combinaison {r.idx + 1}{" "}
                {r.comb ? "• " + r.comb.map((n) => n.toString().padStart(2, "0")).join(" ") : ""}
              </summary>
              <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                {r.checks.map(([k, v]) => (
                  <li
                    key={k}
                    className={`rounded px-2 py-1 border inline-flex items-center gap-2 ${
                      v ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-700"
                    }`}
                  >
                    <span>{v ? "✔︎" : "✘"}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      {showRaw && result !== null && (
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">{raw}</pre>
      )}
    </div>
  );
}

