"use client";
import { useState } from "react";

type Combinaison = {
  bloc: number;
  combinaison: number[];
  etoile: boolean;
};

type ApiSuccess = {
  ok: true;
  data: Combinaison[];
  echo: { loterie: string; blocs: number };
  source: string;
};

type ApiError = {
  ok: false;
  error: string;
  [key: string]: unknown;
};

type ApiResponse = ApiSuccess | ApiError;

export default function Home() {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generer = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      setErr("NEXT_PUBLIC_API_URL est vide ou non définie.");
      setResultat(null);
      return;
    }

    setLoading(true);
    setErr(null);
    setResultat(null);

    try {
      const res = await fetch(`${base}/api/generer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: "2", blocs: 1, mode: "Gb" }),
      });

      // Même si status != 200, on tente de lire le JSON (ton backend renvoie un JSON d’erreur)
      const data: ApiResponse = await res.json();
      setResultat(data);
      if (!res.ok && "error" in data) {
        setErr(`API error: ${String(data.error)}`);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">🎲 Générateur de Combinaisons</h1>

      <button
        onClick={generer}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Chargement..." : "Générer une combinaison"}
      </button>

      {err && (
        <div className="mb-4 text-red-600">
          <strong>Erreur :</strong> {err}
        </div>
      )}

      {resultat && (
        <pre className="bg-gray-100 p-4 rounded w-full max-w-xl text-sm overflow-auto">
          {JSON.stringify(resultat, null, 2)}
        </pre>
      )}
    </main>
  );
}

