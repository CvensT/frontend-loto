"use client";

import { useState } from "react";
import MenuPrincipal from "./components/MenuPrincipal";
import GenerateurGb from "./components/GenerateurGb";
import VerificationCombinaison from "./components/VerificationCombinaison";
import VerificationBlocs from "./components/VerificationBlocs";

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
  const [selection, setSelection] = useState<{
    loterieId: string;
    action: string;
  } | null>(null);

  const appelerAPI = async (action: string, loterieId: string) => {
    try {
      setLoading(true);
      setResultat(null);
      setErr(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: action, loterie: loterieId, blocs: 1 }),
      });

      const json: ApiResponse = await res.json();
      setResultat(json);
      setSelection({ action, loterieId });

      if (!json.ok) {
        setErr(json.error || "Erreur inconnue");
      }
    } catch (e: any) {
      setErr(e.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎯 AI Générateur de Combinaisons</h1>

      <MenuPrincipal onSubmit={appelerAPI} />

      {loading && <p className="text-blue-600 mt-4">Chargement...</p>}

      {err && (
        <p className="text-red-600 mt-4 font-semibold">
          ❌ Erreur : {err}
        </p>
      )}

      {resultat?.ok && selection?.action === "Gb" && (
        <GenerateurGb data={resultat.data} source={resultat.source} />
      )}

      {selection?.action === "V" && (
        <VerificationCombinaison loterieId={selection.loterieId} />
      )}

      {selection?.action === "Vb" && (
        <VerificationBlocs loterieId={selection.loterieId} />
      )}
    </main>
  );
}
