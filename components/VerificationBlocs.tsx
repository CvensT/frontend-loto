"use client";

import { useState } from "react";

export default function VerificationBlocs({ loterieId }: { loterieId: string }) {
  const [bloc, setBloc] = useState(1);
  const [result, setResult] = useState<string | object | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc }),
        cache: "no-store",
      });
      const text = await r.text();
      try {
        setResult(JSON.parse(text) as object);
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

  const rendered = typeof result === "string" ? result : JSON.stringify(result, null, 2);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Vb — Vérifier couverture de blocs (base+étoile)</h3>
      <div className="flex items-center gap-3">
        <label className="text-sm">Bloc</label>
        <input
          type="number"
          min={1}
          value={bloc}
          onChange={(e) => setBloc(parseInt(e.target.value || "1", 10))}
          className="border rounded px-2 py-1 w-24"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {result !== null && (
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">
          {rendered}
        </pre>
      )}
    </div>
  );
}
