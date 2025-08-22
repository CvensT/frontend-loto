"use client";

import { useState } from "react";

export default function VerificationHistorique({ loterieId }: { loterieId: string }) {
  const [input, setInput] = useState("");
  const [resultat, setResultat] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verifierDansHistorique = async () => {
    setErreur(null);
    setResultat(null);
    setLoading(true);

    try {
      const nums = input
        .split(/[^0-9]+/)
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n));

      if (nums.length === 0) {
        setErreur("Veuillez entrer au moins une combinaison valide.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verifier-historique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, combinaison: nums }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErreur(data.error || "Erreur API");
      } else {
        setResultat(data.message || "Pas de correspondance dans l'historique.");
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="mb-2 text-xl font-semibold">📚 Vérification dans l’historique</h2>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ex: 4 13 22 29 37 44 48"
        className="w-full rounded border p-2 font-mono"
      />
      <button
        onClick={verifierDansHistorique}
        className="mt-2 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={loading}
      >
        Vérifier dans l’historique
      </button>
      {loading && <div className="mt-2 text-gray-600">⏳ Vérification...</div>}
      {erreur && <div className="mt-2 text-red-600">❌ {erreur}</div>}
      {resultat && <div className="mt-2 text-green-700">✅ {resultat}</div>}
    </div>
  );
}
