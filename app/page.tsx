// app/page.tsx
"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";

type Combinaison = { bloc: number; combinaison: number[]; etoile: boolean };
type ApiSuccessGnGb = { ok: true; data: Combinaison[] | { combinaison: number[] }; echo?: Record<string, unknown>; source?: string; };
type ApiFailure = { ok: false; error: string; [key: string]: unknown };
type ApiResponse = ApiSuccessGnGb | ApiFailure;

function Placeholder({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 rounded border border-dashed p-4 text-gray-600">{children}</div>;
}

export default function Page() {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ loterieId: string; action: string } | null>(null);

  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const appelerAPI = async (action: string, loterieId: string) => {
    setLoading(true);
    setErr(null);
    setResultat(null);

    try {
      if (action === "Gn" || action === "Gb") {
        const res = await fetch(`${base}/api/generer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loterie: loterieId, blocs: 1, mode: action }),
        });
        const data: ApiResponse = await res.json().catch(() => ({ ok: false, error: "Réponse invalide JSON." } as ApiFailure));
        if (!res.ok || (data && "ok" in data && data.ok === false)) {
          setErr((data as ApiFailure)?.error ?? `Erreur HTTP ${res.status}`);
          setResultat(data);
        } else {
          setResultat(data);
        }
      } else if (action === "V") {
        setErr("Vérification (V) non encore implémentée côté frontend.");
      } else if (action === "Vb") {
        setErr("Vérification de blocs (Vb) non encore implémentée côté frontend.");
      } else if (action === "A") {
        setErr("Analyse (A) non encore implémentée côté frontend.");
      } else if (action === "H") {
        setErr("Historique (H) non encore implémenté côté frontend.");
      } else {
        setErr(`Action inconnue: ${action}`);
      }
    } catch (e: unknown) {
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
          void appelerAPI(action, loterieId);
        }}
      />

      {loading && <div className="mt-2 animate-pulse text-gray-700">⏳ Chargement…</div>}
      {err && <div className="mt-2 rounded bg-red-50 p-3 text-sm text-red-700">⚠️ {err}</div>}

      {resultat && "ok" in resultat && resultat.ok && selection?.action === "Gb" && (
        <GenerateurGb loterieId={selection.loterieId} />
      )}

      {resultat && "ok" in resultat && resultat.ok && selection?.action === "Gn" && (
        <Placeholder>
          <div className="text-green-700 font-semibold">Combinaisons générées (mode Gn)</div>
          <pre className="mt-2 overflow-auto text-sm">{JSON.stringify(resultat.data, null, 2)}</pre>
        </Placeholder>
      )}

      {selection?.action === "V" && <Placeholder>Résultat de la vérification (à brancher).</Placeholder>}
      {selection?.action === "Vb" && <Placeholder>Résultat de la vérification de blocs (à brancher).</Placeholder>}
      {selection?.action === "A" && <Placeholder>Analyse de la combinaison (à brancher).</Placeholder>}
      {selection?.action === "H" && <Placeholder>Historique des combinaisons (à brancher).</Placeholder>}

      {resultat && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">Voir la réponse brute</summary>
          <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(resultat, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
