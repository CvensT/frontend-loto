"use client";

import { useState } from "react";

export default function VerificationCombinaison({ loterieId }: { loterieId: string }) {
  const [saisie, setSaisie] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const nums = saisie
        .split(/[ ,;]+/)
        .map((x) => parseInt(x, 10))
        .filter((n) => Number.isFinite(n));

      const r = await fetch("/api/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, combinaison: nums }),
        cache: "no-store",
      });
      const text = await r.text();
      try {
        setResult(JSON.parse(text));
      } catch {
        setResult(text);
      }
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
      else setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">V — Vérifier si combinaison existe</h3>
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Entrez la combinaison ex: 1 2 3 4 5 6 7"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          className="border rounded px-2 py-1 min-w-[280px] flex-1"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
      </div>
      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}
      {result && (
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">
          {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
