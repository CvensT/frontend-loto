"use client";
import { useState } from "react";

export default function Home() {
  const [resultat, setResultat] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loterie: "2",
          blocs: 1,
          mode: "Gb"
        })
      });

      const data = await res.json();
      setResultat(data);
    } catch (e) {
      console.error(e);
setResultat({ error: "Erreur lors de l'appel à l'API.", details: e instanceof Error ? e.message : e });

    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">🎲 Générateur de Combinaisons</h1>
      <button
        onClick={generer}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700 transition"
      >
        Générer une combinaison
      </button>

      {loading && <p>Chargement...</p>}

      {resultat && (
        <pre className="bg-gray-100 p-4 rounded w-full max-w-xl text-sm overflow-auto">
          {JSON.stringify(resultat, null, 2)}
        </pre>
      )}
    </main>
  );
}
