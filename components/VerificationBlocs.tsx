"use client";

import { useEffect, useState } from "react";

type RésultatVb = {
  doublons: string[];
  non_conformes: {
    bloc: number;
    combinaison: number[];
    raison: string;
  }[];
};

export default function VerificationBlocs({ loterieId }: { loterieId: string }) {
  const [résultat, setRésultat] = useState<RésultatVb | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
    const fetchData = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${base}/api/verifier-bloc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loterie: loterieId }),
        });

        const data = await res.json();
        if (!res.ok || data.ok === false) {
          setErr(data?.error || "Erreur lors de la vérification des blocs.");
        } else {
          setRésultat(data);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loterieId]);

  if (loading) return <p className="text-gray-600">🔍 Vérification des blocs en cours...</p>;
  if (err) return <p className="text-red-600">❌ {err}</p>;

  return (
    <div className="mt-4">
      <h2 className="font-semibold text-blue-700 mb-2">📋 Résultat de la vérification des blocs</h2>

      {résultat?.doublons?.length ? (
        <div className="mb-4">
          <h3 className="text-red-700 font-medium">🔁 Doublons détectés :</h3>
          <ul className="list-disc ml-6 text-sm">
            {résultat.doublons.map((d, idx) => (
              <li key={idx}>{d}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-green-700">✅ Aucun doublon trouvé.</p>
      )}

      {résultat?.non_conformes?.length ? (
        <div className="mt-4">
          <h3 className="text-orange-700 font-medium">🚫 Combinaisons non conformes :</h3>
          <ul className="list-disc ml-6 text-sm">
            {résultat.non_conformes.map((nc, idx) => (
              <li key={idx}>
                Bloc {nc.bloc} : [{nc.combinaison.join(", ")}] – {nc.raison}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-green-700 mt-2">✅ Toutes les combinaisons respectent les critères.</p>
      )}
    </div>
  );
}
