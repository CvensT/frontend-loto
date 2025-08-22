"use client";

import { useState } from "react";
import MenuPrincipal from "./components/MenuPrincipal";
import GenerateurGb from "./components/GenerateurGb";
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
  const [selection, setSelection] = useState<{ loterieId: string; action: string } | null>(null);

  const appelerAPI = async (action: string, loterieId: string) => {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, mode: action, blocs: 1 }),
      });

      const json = await res.json();
      setResultat(json);
    } catch (e: any) {
      setErr("Erreur API : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">AI Générateur de Combinaisons</h1>

      <MenuPrincipal
        onValider={(loterieId, action) => {
          setSelection({ loterieId, action });
          appelerAPI(action, loterieId);
        }}
      />

      {loading && <p>Chargement...</p>}
      {err && <p className="text-red-500">{err}</p>}

      {resultat && resultat.ok && selection?.action === "Gb" && (
        <GenerateurGb data={resultat.data} />
      )}

      {resultat && resultat.ok && selection?.action === "Vb" && (
        <VerificationBlocs data={resultat.data} />
      )}

      {resultat && resultat.ok && selection?.action === "V" && (
        <VerificationHistorique data={resultat.data} />
      )}

      {resultat && !resultat.ok && (
        <p className="text-red-600 mt-4">Erreur : {resultat.error}</p>
      )}
    </main>
  );
}
