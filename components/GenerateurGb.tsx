"use client";

import { useState } from "react";

type Props = {
  loterieId: "1" | "2" | "3";
};

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

type ApiError = {
  ok: false;
  error: string;
  [key: string]: unknown;
};

type ApiResponse = ApiSuccess | ApiError;

export default function GenerateurGb({ loterieId }: Props) {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [nbBlocs, setNbBlocs] = useState(1);

  const generer = async () => {
    setLoading(true);
    setErr(null);
    setResultat(null);

    try {
      const r = await fetch("/api/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loterie: loterieId,
          mode: "Gb",
          blocs: nbBlocs,
        }),
      });

      const json: ApiResponse = await r.json();
      setResultat(json);
    } catch (e) {
      if (e instanceof Error) setErr(e.message);
      else setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-2xl p-4 space-y-4 w-full max-w-2xl">
      <div className="text-lg font-semibold">Gb — Génération par blocs couvrants (+ étoile)</div>

      <label className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Nombre de blocs :</span>
        <input
          type="number"
          value={nbBlocs}
          onChange={(e) => setNbBlocs(Number(e.target.value))}
          min={1}
          max={30}
          className="w-20 rounded-xl border px-2 py-1 text-center"
        />
      </label>

      <div className="flex gap-4">
        <button
          onClick={generer}
          disabled={loading}
          className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Génération..." : "Générer"}
        </button>
        <button
          onClick={() => {
            setResultat(null);
            setErr(null);
          }}
          className="rounded-xl px-4 py-2 border hover:bg-gray-50"
        >
          Réinitialiser
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {resultat !== null && resultat.ok && (
        <div>
          {resultat.echo && (
            <p className="text-sm text-gray-500">
              Loterie {resultat.echo.loterie} — {resultat.echo.blocs} blocs
              générés ({resultat.data.length} combinaisons)
            </p>
          )}
          <pre className="whitespace-pre-wrap font-mono text-sm mt-2">
            {resultat.data.map((c) => {
              const nums = c.combinaison.map((n) => String(n).padStart(2, "0")).join(" ");
              return `Bloc ${c.bloc} → ${nums}${c.etoile ? "  ★" : ""}`;
            }).join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
