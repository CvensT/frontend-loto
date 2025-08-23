"use client";

import { useState } from "react";

type Props = {
  loterieId: "1" | "2" | "3";
};

type ApiOk = {
  ok: true;
  data: {
    existe: boolean;
    occurrences?: number;
    premieres_dates?: string[];
  };
};

type ApiErr = {
  ok: false;
  error: string;
  [k: string]: unknown;
};

type ApiResponse = ApiOk | ApiErr;

function parseNumbers(input: string) {
  return input
    .split(/[\s,;\/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n));
}

export default function VerificationCombinaison({ loterieId }: Props) {
  const [saisie, setSaisie] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const envoyer = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);

    try {
      const nums = parseNumbers(saisie);

      if (nums.length === 0) {
        throw new Error("Entre une combinaison (ex.: 8 10 16 19 33 46 48)");
      }

      const r = await fetch("/api/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loterie: loterieId,
          combinaison: nums,
        }),
      });

      const json: ApiResponse = await r.json();
      setResult(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div className="text-lg font-semibold">V — Vérifier si une combinaison existe</div>
      <p className="text-sm text-gray-600">
        Cette vérification <span className="font-medium">ne fait pas</span> de contrôle de critères.
        Elle répond uniquement à la question :
        <span className="italic"> “Cette combinaison a-t-elle déjà été tirée ?”</span>
      </p>

      <input
        className="w-full rounded-xl border px-3 py-2 font-mono"
        placeholder="Ex.: 8 10 16 19 33 46 48"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
      />
      <p className="text-xs text-gray-500 mt-1">
        Séparateurs acceptés : espace, virgule, point-virgule, slash.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={envoyer}
          disabled={loading}
          className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Vérification..." : "Vérifier"}
        </button>
        <button
          onClick={() => {
            setSaisie("");
            setResult(null);
            setErr(null);
          }}
          className="rounded-xl px-4 py-2 border hover:bg-gray-50"
        >
          Réinitialiser
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {result !== null &&
        (result.ok ? (
          <div className="rounded-xl border p-3">
            <div className="text-sm">
              Statut :{" "}
              {result.data.existe ? (
                <span className="text-green-700 font-semibold">DÉJÀ TIRÉE</span>
              ) : (
                <span className="text-gray-700 font-semibold">AUCUNE OCCURRENCE</span>
              )}
            </div>
            {result.data.occurrences != null && (
              <div className="text-sm">Occurrences : {result.data.occurrences}</div>
            )}
            {result.data.premieres_dates?.length ? (
              <div className="text-sm">
                Dates (extrait) : {result.data.premieres_dates.slice(0, 5).join(", ")}
              </div>
            ) : null}
          </div>
        ) : (
          <pre className="text-orange-700 text-sm whitespace-pre-wrap">
            {result.error ?? "Réponse invalide."}
          </pre>
        ))}
    </div>
  );
}
