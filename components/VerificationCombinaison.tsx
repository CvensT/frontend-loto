"use client";

import { useMemo, useState } from "react";

type ApiSuccess = {
  ok: true;
  data: {
    existe: boolean;
    criteres?: Record<string, unknown>;
  };
};
type ApiError = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = ApiSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, min: 1, max: 49, placeholder: "1 9 17 25 33" },
  "2": { name: "Lotto Max", numsPerComb: 7, min: 1, max: 50, placeholder: "1 8 14 20 27 38 45" },
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

  const aide = useMemo(
    () => `Entrez ${cfg.numsPerComb} nombres distincts entre ${cfg.min} et ${cfg.max} (ex: ${cfg.placeholder}).`,
    [cfg]
  );

  const parseAndValidate = (): number[] => {
    const nums = saisie
      .trim()
      .replace(/[;,]+/g, " ")
      .split(/\s+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => Number.isFinite(n));

    if (nums.length !== cfg.numsPerComb) {
      throw new Error(`Il faut exactement ${cfg.numsPerComb} nombres. Vous en avez fourni ${nums.length}.`);
    }
    const uniq = new Set(nums);
    if (uniq.size !== nums.length) {
      throw new Error("Aucun doublon autorisé dans la combinaison.");
    }
    const horsPlage = nums.filter((n) => n < cfg.min || n > cfg.max);
    if (horsPlage.length) {
      throw new Error(`Valeurs hors plage [${cfg.min}–${cfg.max}] : ${horsPlage.join(", ")}`);
    }
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

  const renderSummary = () => {
    if (!result || typeof result === "string" || !("ok" in result) || !result.ok) return null;

    const crt = result.data?.criteres;
    let comb: number[] | null = null;
    const candidate = crt && (crt as Record<string, unknown>)["Combinaison"];
    if (Array.isArray(candidate) && candidate.every((n) => typeof n === "number")) {
      comb = candidate as number[];
    }

    return (
      <div className="text-sm">
        <div className="font-medium">
          {comb ? `Combinaison ${fmtComb(comb)} : ` : "Combinaison : "}
          {result.data.existe ? (
            <span className="text-red-600 font-semibold">déjà tirée (historique)</span>
          ) : (
            <span className="text-green-700 font-semibold">jamais tirée</span>
          )}
        </div>
      </div>
    );
  };

  const renderCriteres = () => {
    if (!result || typeof result === "string" || !("ok" in result) || !result.ok) return null;
    const crt = result.data?.criteres;
    if (!crt || typeof crt !== "object") return null;

    const rows: Array<[string, boolean]> = [];
    for (const [k, v] of Object.entries(crt)) {
      if (k === "Combinaison") continue;
      if (typeof v === "boolean") rows.push([k, v]);
    }
    if (!rows.length) return null;

    return (
      <div className="mt-2 text-xs">
        <div className="font-semibold mb-1">Critères</div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {rows.map(([k, v]) => (
            <li key={k} className={v ? "text-green-700" : "text-red-600"}>
              {v ? "✔︎" : "✘"} {k}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderRaw = () => {
    if (result === null) return null;
    const rendered = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    return <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded mt-2">{rendered}</pre>;
  };

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
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="border rounded px-2 py-1 min-w-[280px] flex-1"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {renderSummary()}
      {renderCriteres()}
      {renderRaw()}
    </div>
  );
}
