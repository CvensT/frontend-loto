"use client";

import { useState } from "react";

export default function VerificationBlocs({ loterieId }: { loterieId: string }) {
  const [blocInput, setBlocInput] = useState("");
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verifierBloc = async () => {
    setErreur(null);
    setResultat(null);
    setLoading(true);

    try {
      const lignes = blocInput.trim().split("\n");
      const combinaisons = lignes
        .map((line) =>
          line
            .trim()
            .split(/[^0-9]+/)
            .map((v) => parseInt(v, 10))
            .filter((n) => !isNaN(n))
        )
        .filter((c) => c.length > 0);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verifier-bloc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, combinations: combinaisons }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErreur(data.error || "Erreur API");
      } else {
        setResultat(data);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="mb-2 text-xl font-semibold">📦 Vérification d’un bloc (local)</h2>
      <textarea
        rows={8}
        value={blocInput}
        onChange={(e) => setBlocInput(e.target.value)}
        placeholder={`Entrez une combinaison par ligne\nEx:\n4 15 26 33 38 45 47\n1 3 7 12 22 30 50`}
        className="w-full rounded border p-2 font-mono"
      />
      <button
        onClick={verifierBloc}
        className="mt-2 rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={loading || !blocInput.trim()}
      >
        Vérifier le bloc
      </button>

      {loading && <div className="mt-2 text-gray-600">⏳ Vérification...</div>}
      {erreur && <div className="mt-2 text-red-600">❌ {erreur}</div>}

      {resultat && (
        <div className="mt-4 rounded border p-3 text-sm bg-gray-50 text-gray-800">
          <p className="font-semibold text-green-700">{resultat.message}</p>

          {resultat.doublons?.length > 0 && (
            <div className="mt-2 text-red-600">
              🔁 Doublons détectés : {resultat.doublons.join(", ")}
            </div>
          )}

          {resultat.invalides?.length > 0 && (
            <div className="mt-2 text-orange-600">
              ❌ Combinaisons invalides : {resultat.invalides.join(", ")} (ne respectent pas les critères)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
