// ✅ VerificationCombinaison.tsx
"use client";

import { useState } from "react";

export default function VerificationCombinaison({ loterieId }: { loterieId: string }) {
  const [combinaison, setCombinaison] = useState("");
  const [resultat, setResultat] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const verifier = async () => {
    setResultat(null);
    setErreur(null);
    try {
      const res = await fetch(`${base}/api/verifier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, combinaison }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setErreur(data.error || "Erreur lors de la vérification.");
      else setResultat(data.message || "✅ Combinaison valide.");
    } catch (e) {
      setErreur("Erreur réseau ou serveur.");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">🔍 Vérifier une combinaison</h2>
      <input
        type="text"
        placeholder="ex: 1 2 3 4 5 6 7"
        value={combinaison}
        onChange={(e) => setCombinaison(e.target.value)}
        className="mt-2 border p-2 rounded w-full"
      />
      <button
        onClick={verifier}
        className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
      >
        Vérifier
      </button>
      {resultat && <p className="mt-2 text-green-700">✅ {resultat}</p>}
      {erreur && <p className="mt-2 text-red-600">❌ {erreur}</p>}
    </div>
  );
}

