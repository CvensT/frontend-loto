"use client";

import { useMemo, useState } from "react";

type ApiSuccess = { ok: true; data: { existe: boolean; criteres?: Record<string, unknown> } };
type ApiError   = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = ApiSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, min: 1, max: 49, placeholder: "1 9 17 25 33" },
  "2": { name: "Lotto Max",  numsPerComb: 7, min: 1, max: 50, placeholder: "1 8 14 20 27 38 45" },
  "3": { name: "Lotto 6/49", numsPerComb: 6, min: 1, max: 49, placeholder: "2 8 16 31 38 41" },
} as const;

function fmtComb(nums: number[]) {
  return nums.map((n) => n.toString().padStart(2, "0")).join(" ");
}

export default function VerificationCombinaison({ loterieId }: { loterieId: string }) {
  const cfg = CFG[(loterieId as keyof typeof CFG) ?? "2"];
  const [saisie, setSaisie] = useState("");
  const [result, setResult] = useState<ApiResponse | string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const aide = useMemo(
    () => `Entrez ${cfg.numsPerComb} nombres distincts entre ${cfg.min} et ${cfg.max} (ex: ${cfg.placeholder}).`,
    [cfg]
  );

  const parseAndValidate = (): number[] => {
    const nums = saisie
      .trim().replace(/[;,]+/g, " ")
      .split(/\s+/).map((x) => parseInt(x, 10))
      .filter((n) => Number.isFinite(n));

    if (nums.length !== cfg.numsPerComb) throw new Error(`Il faut exactement ${cfg.numsPerComb} nombres.`);
    const uniq = new Set(nums);
    if (uniq.size !== nums.length) throw new Error("Aucun doublon autorisé.");
    const out = nums.filter((n) => n < cfg.min || n > cfg.max);
    if (out.length) throw new Error(`Valeurs hors plage [${cfg.min}–${cfg.max}] : ${out.join(", ")}`);
    return [...nums].sort((a, b) => a - b);
  };

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const comb = parseAndValidate();
      const r = await fetch("/api/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, combinaison: comb }),
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

  // --- rendu “friendly” ---
  const isOk = (r: ApiResponse | string | null): r is ApiSuccess =>
    !!r && typeof r !== "string" && "ok" in r && r.ok;

  const combFromCrit = (): number[] | null => {
    if (!isOk(result)) return null;
    const crit = result.data.criteres;
    const c = crit && (crit as Record<string, unknown>)["Combinaison"];
    return Array.isArray(c) && c.every((x) => typeof x === "number") ? (c as number[]) : null;
  };

  const critList = useMemo(() => {
    if (!isOk(result) || !result.data.criteres) return [];
    const entries = Object.entries(result.data.criteres);
    return entries
      .filter(([k, v]) => k !== "Combinaison" && typeof v === "boolean")
      .map(([k, v]) => [k, v as boolean]) as Array<[string, boolean]>;
  }, [result]);

  const raw = result === null ? "" : typeof result === "string" ? result : JSON.stringify(result, null, 2);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">V — Vérifier si combinaison existe</h3>

      <div className="text-sm text-gray-600">
        Loterie <b>{cfg.name}</b>. {aide}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder={cfg.placeholder}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="border rounded px-2 py-1 min-w-[280px] flex-1"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
        <button
          onClick={() => setShowRaw((s) => !s)}
          className="px-3 py-2 rounded-xl border text-xs"
          disabled={result === null}
        >
          {showRaw ? "Masquer JSON" : "Voir JSON"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {isOk(result) && (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">
              {combFromCrit() ? `Combinaison ${fmtComb(combFromCrit()!)} : ` : "Combinaison : "}
            </span>
            {result.data.existe ? (
              <span className="text-red-600 font-semibold">déjà tirée (historique)</span>
            ) : (
              <span className="text-green-700 font-semibold">jamais tirée</span>
            )}
          </div>

          {!!critList.length && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
              {critList.map(([k, v]) => (
                <li key={k} className={`rounded px-2 py-1 border inline-flex items-center gap-2 ${v ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-700"}`}>
                  <span>{v ? "✔︎" : "✘"}</span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showRaw && result !== null && (
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">{raw}</pre>
      )}
    </div>
  );
}
