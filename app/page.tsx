"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
// Types pour les données API

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

export default function Home() {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ loterieId: string; action: string } | null>(null);

  const appelerAPI = async (action: string, loterieId: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      setErr("NEXT_PUBLIC_API_URL est vide ou non définie.");
      setResultat(null);
      return;
    }

    setLoading(true);
    setErr(null);
    setResultat(null);

    if (action === "gb") {
      try {
        const res = await fetch(`${base}/api/generer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loterie: loterieId, blocs: 1, mode: "Gb" }),
        });
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
    } else {
      setErr("Cette action n'est pas encore implémentée côté frontend.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">🎲 AI Générateur de Combinaisons</h1>

      <MenuPrincipal
  onChoix={(loterieId) => {
    setSelection({ action: "Gb", loterieId });
    appelerAPI("Gb", loterieId);
  }}
/>
      {loading && <p className="mt-4">⏳ Chargement en cours...</p>}

      {err && (
        <div className="mb-4 text-red-600">
          <strong>Erreur :</strong> {err}
        </div>
      )}

      {resultat && (
        <pre className="bg-gray-100 p-4 rounded w-full max-w-xl text-sm overflow-auto mt-4">
          {JSON.stringify(resultat, null, 2)}
        </pre>
      )}
    </main>
  );
}

