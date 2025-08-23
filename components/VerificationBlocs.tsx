"use client";

import { useMemo, useState } from "react";

type VerifierBlocSuccess = {
  ok: true;
  data: { valide: boolean; erreurs: string[]; details: unknown };
};
type ApiError = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = VerifierBlocSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, baseCount: 9 },
  "2": { name: "Lotto Max", numsPerComb: 7, baseCount: 7 },
  "3": { name: "Lotto 6/49", numsPerComb: 6, baseCount: 8 },
} as const;

function parseBlockText(text: string, numsPerComb: number) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const block: number[][] = [];
  for (const l of lines) {
    const tokens = l.replace(/[;,]+/g, " ").split(/\s+/);
    const nums = tokens
      .map((t) => parseInt(t, 10))
      .filter((n) => Number.isFinite(n));
    if (nums.length !== numsPerComb) {
      throw new Error(
        `Chaque ligne doit contenir exactement ${numsPerComb} nombres — ligne invalide: "${l}"`
      );
    }
    block.push([...nums].sort((a, b) => a - b));
  }
  return block;
}

export default function VerificationBlocs({ loterieId }: { loterieId: string }) {
  const cfg = CFG[(loterieId as keyof typeof CFG) ?? "2"];
  const expectedTotal = cfg.baseCount + 1;

  const [blocText, setBlocText] = useState<string>("");
  const [etoileIndex, setEtoileIndex] = useState<number>(cfg.baseCount);
  const [result, setResult] = useState<ApiResponse | string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(() => {
    const sample: number[][] =
      loterieId === "2"
        ? [
            [2, 8, 16, 31, 38, 41, 47],
            [3, 9, 15, 22, 33, 40, 50],
            [4, 10, 17, 26, 34, 42, 48],
            [5, 11, 18, 27, 35, 43, 49],
            [6, 12, 19, 28, 36, 44, 46],
            [7, 13, 20, 29, 37, 45, 25],
            [1, 14, 21, 23, 24, 30, 32],
            [1, 8, 14, 20, 27, 38, 45], // étoile
          ]
        : loterieId === "1"
        ? [
            [1, 9, 17, 25, 33],
            [2, 10, 18, 26, 34],
            [3, 11, 19, 27, 35],
            [4, 12, 20, 28, 36],
            [5, 13, 21, 29, 37],
            [6, 14, 22, 30, 38],
            [7, 15, 23, 31, 39],
            [8, 16, 24, 32, 40],
            [9, 17, 25, 33, 41],
            [1, 12, 23, 34, 45], // étoile
          ]
        : [
            [2, 8, 16, 31, 38, 41],
            [3, 9, 15, 22, 33, 40],
            [4, 10, 17, 26, 34, 42],
            [5, 11, 18, 27, 35, 43],
            [6, 12, 19, 28, 36, 44],
            [7, 13, 20, 29, 37, 45],
            [1, 14, 21, 23, 24, 30],
            [1, 8, 14, 20, 27, 38], // étoile
          ];
    return sample.map((row) => row.join(" ")).join("\n");
  }, [loterieId]);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const parsed = parseBlockText(blocText, cfg.numsPerComb);
      if (parsed.length !== expectedTotal) {
        throw new Error(
          `Le bloc doit contenir ${expectedTotal} lignes (base: ${cfg.baseCount} + 1 étoile). Actuellement: ${parsed.length}`
        );
      }
      if (etoileIndex < 0 || etoileIndex >= parsed.length) {
        throw new Error(
          `etoileIndex doit être compris entre 0 et ${parsed.length - 1}.`
        );
      }

      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc: parsed, etoileIndex }),
        cache: "no-store",
      });

      const text = await r.text();
      try {
        setResult(JSON.parse(text) as ApiResponse);
      } catch {
        setResult(text);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const rendered =
    typeof result === "string" ? result : JSON.stringify(result, null, 2);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Vb — Vérifier couverture de blocs (base + étoile)</h3>

      <div className="text-sm text-gray-600">
        Loterie <b>{cfg.name}</b> — {cfg.baseCount} combinaisons de base + 1 étoile.
        <br />
        Collez {expectedTotal} lignes, <i>une ligne = une combinaison</i> ({cfg.numsPerComb} nombres).
        <br />
        <span className="opacity-80">Par défaut, l’étoile est la dernière ligne (index {cfg.baseCount}).</span>
      </div>

      <textarea
        value={blocText}
        onChange={(e) => setBlocText(e.target.value)}
        rows={Math.max(8, expectedTotal + 1)}
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
            setEtoileIndex(Math.max(0, Math.min(expectedTotal - 1, Number.isFinite(v) ? v : cfg.baseCount)));
          }}
          className="border rounded px-2 py-1 w-24"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {result !== null ? (
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">{rendered}</pre>
      ) : null}
    </div>
  );
}

