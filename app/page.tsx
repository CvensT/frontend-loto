"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationHistorique from "../components/VerificationHistorique";
import VerificationBlocs from "../components/VerificationBlocs";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, mode: action, blocs: 1 }),
      });

      const data: ApiResponse = await res.json();
      setResultat(data);
    } catch (error: any) {
      setErr(error.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <MenuPrincipal
        onSelect={(choix) => {
          setSelection(choix);
          appelerAPI(choix.action, choix.loterieId);
        }}
      />

      {loading && <p>Chargement...</p>}
      {err && <p className="text-red-500">{err}</p>}

      {resultat?.ok && selection?.action === "Gb" && (
        <GenerateurGb data={resultat.data} />
      )}

      {resultat?.ok && selection?.action === "Vb" && (
        <VerificationBlocs data={resultat.data} />
      )}

      {resultat?.ok && selection?.action === "H" && (
        <VerificationHistorique data={resultat.data} />
      )}
    </div>
  );
}
