"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
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
};

type ApiResponse = ApiSuccess | ApiError;

export default function Page() {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ loterieId: string; action: string } | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";

  const appelerAPI = async (action: string, loterieId: string) => {
    setLoading(true);
    setErr(null);
    setResultat(null);

    try {
      if (action === "Gb") {
        const res = await fetch(`${base}/api/generer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loterie: loterieId, blocs: 1, mode: action }),
        });

        const data: ApiResponse = await res.json();
        if (!res.ok || !data.ok) {
          setErr(data.ok === false ? data.error : "Erreur API");
        } else {
          setResultat(data);
        }
      } else {
        setErr("Ce mode nécessite une interaction utilisateur.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <MenuPrincipal
        onChoix={(loterieId, action) => {
          setSelection({ loterieId, action });
          appelerAPI(action, loterieId);
        }}
      />

      {loading && <div className="mt-4 text-gray-600">⏳ Chargement...</div>}
      {err && <div className="mt-4 text-red-600">❌ {err}</div>}

      {selection?.action === "Gb" && resultat?.ok && (
        <GenerateurGb loterieId={selection.loterieId} />
      )}

      {selection?.action === "V" && (
        <VerificationCombinaison loterieId={selection.loterieId} />
      )}

      {selection?.action === "Vb" && (
        <VerificationBlocs loterieId={selection.loterieId} />
      )}
    </div>
  );
}
