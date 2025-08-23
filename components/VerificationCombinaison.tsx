"use client";

import { useState } from "react";

type ApiOk = {
  ok: true;
  data: {
    existe: boolean;                 // true si trouvée dans l'historique
    occurrences?: number;            // nb de fois (optionnel)
    premieres_dates?: string[];      // ex: ["2024-01-12", ...] (optionnel)
  };
};

type ApiErr = {
  ok: false;
  error: string;
  [k: string]: unknown;
};

type ApiResponse = ApiOk | ApiErr;

const LOTERIES = [
  { id: "1", nom: "Grande Vie" },
  { id: "2", nom: "Lotto Max" },
  { id: "3", nom: "Lotto 6/49" },
];

function parseNumbers(input: string) {
  // Accepte séparateurs : espace, virgule, point-virgule, slash
  return input
    .split(/[\s,;\/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n));
}

export default function VerificationCombinaison() {
  const [loterieId, setLoterieId] = useState("2"); // par défaut: Lotto Max
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
          combinaison: nums, // ex.: [8,10,16,19,33,46,48]
        }),
      });

      const json: ApiResponse = await r.json();
      setResult(json);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div className="text-lg font-semibold">V — Vérifier si une combinaison existe</div>
      <p className="text-sm text-gray-600">
        Cette vérification <span className="font-medium">ne fait pas</span> de contrôle de critères. Elle répond uniquement à la question :
        <span className="italic"> “Cette combinaison a-t-elle déjà été tirée ?”</span>
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="w-28 text-sm text-gray-700">Loterie</span>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={loterieId}
            onChange={(e) => setLoterieId(e.target.value)}
          >
            {LOTERIES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2">
          <input
            className="w-full rounded-xl border px-3 py-2 font-mono"
            placeholder="Ex.: 8 10 16 19 33 46 48"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Séparateurs acceptés : espace, virgule, point-virgule, slash.
          </p>
        </div>
      </div>

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

