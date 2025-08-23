"use client";

import { useMemo, useState } from "react";

type GenItem = { bloc: number; combinaison: number[]; etoile: boolean };
type GenSuccess = { ok: true; data: GenItem[]; [k: string]: unknown };
type GenError   = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = GenSuccess | GenError;

function Chip({ n, star }: { n: number; star?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium border
        ${star ? "bg-yellow-50 border-yellow-300" : "bg-gray-50 border-gray-300"}`}
      title={star ? "Étoile" : "Base"}
    >
      {n.toString().padStart(2, "0")}
    </span>
  );
}

export default function GenerateurGb({ loterieId }: { loterieId: string }) {
  const [blocsCount, setBlocsCount] = useState(1);
  const [result, setResult] = useState<ApiResponse | string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const r = await fetch("/api/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, mode: "Gb", blocs: blocsCount }),
        cache: "no-store",
      });
      const text = await r.text();
      try {
        setResult(JSON.parse(text) as ApiResponse);
      } catch {
        setResult(text);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    if (!result || typeof result === "string" || !("ok" in result) || !result.ok) return new Map<number, GenItem[]>();
    const map = new Map<number, GenItem[]>();
    for (const it of result.data as GenItem[]) {
      if (!map.has(it.bloc)) map.set(it.bloc, []);
      map.get(it.bloc)!.push(it);
    }
    // tri : base d’abord, étoile ensuite
    for (const [k, arr] of map) {
      arr.sort((a, b) => Number(a.etoile) - Number(b.etoile));
      map.set(k, arr);
    }
    return map;
  }, [result]);

  const raw = useMemo(
    () => (result === null ? "" : typeof result === "string" ? result : JSON.stringify(result, null, 2)),
    [result]
  );

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Gb — Génération par blocs couvrants (+ étoile)</h3>

      <div className="flex items-center gap-3">
        <label className="text-sm">Nombre de blocs</label>
        <input
          type="number"
          min={1}
          value={blocsCount}
          onChange={(e) => setBlocsCount(Math.max(1, parseInt(e.target.value || "1", 10)))}
          className="border rounded px-2 py-1 w-24"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Génération..." : "Générer"}
        </button>
        <button
          onClick={() => setShowRaw((s) => !s)}
          className="px-3 py-2 rounded-xl border ml-auto text-xs"
          disabled={result === null}
          title="Afficher/masquer la réponse brute"
        >
          {showRaw ? "Masquer JSON" : "Voir JSON"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {/* rendu « joli » */}
      {grouped.size > 0 && (
        <div className="grid gap-3">
          {[...grouped.entries()].map(([blocId, items]) => {
            const star = items.find((i) => i.etoile);
            const bases = items.filter((i) => !i.etoile);
            return (
              <div key={blocId} className="rounded-xl border p-3">
                <div className="mb-2 font-semibold">Bloc {blocId}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {bases.map((it, idx) => (
                    <div key={idx} className="flex flex-wrap gap-1">
                      {it.combinaison.map((n) => (
                        <Chip key={n} n={n} />
                      ))}
                    </div>
                  ))}
                  {star && (
                    <div className="flex flex-wrap gap-1 sm:col-span-2">
                      <span className="inline-block mr-2 text-xs font-medium text-yellow-700">★ Étoile</span>
                      {star.combinaison.map((n) => (
                        <Chip key={`s-${n}`} n={n} star />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JSON brut optionnel */}
      {showRaw && result !== null && (
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">{raw}</pre>
      )}
    </div>
  );
}
