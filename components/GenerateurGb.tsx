"use client";
import { useState } from "react";

type Combinaison = {
  bloc: number;
  combinaison: number[];
  etoile: boolean;
};

type ApiResponse =
  | {
      ok: true;
      data: Combinaison[];
      echo: { loterie: string; blocs: number };
      source: string;
    }
  | {
      ok: false;
      error: string;
      [key: string]: unknown;
    };

export default function GenerateurGb({ loterieId }: { loterieId: string }) {
  const [resultat, setResultat] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generer = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      setErr("❌ L’URL de l’API n’est pas définie.");
      return;
    }

    setLoading(true);
    setErr(null);
    setResultat(null);

    try {
      const res = await fetch(`${base}/api/generer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, blocs: 1, mode: "Gb" }),
      });

      const data: ApiResponse = await res.json();
      setResultat(data);

      if (!res.ok && "error" in data) {
        setErr(data.error);
      }
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-xl font-semibold mb-4">Génération (mode Gb)</h2>

      <button
        onClick={generer}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Chargement..." : "Générer"}
      </button>

      {err && <div className="text-red-600 mt-4">❌ {err}</div>}

      {resultat?.ok && (
        <div className="mt-6 space-y-2">
          {resultat.data.map((item, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded p-2 font-mono text-sm"
            >
              Bloc {item.bloc} :{" "}
              {item.combinaison.map((n) => n.toString().padStart(2, "0")).join(" ")}{" "}
              {item.etoile && "★"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
