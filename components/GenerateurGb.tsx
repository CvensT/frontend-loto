"use client";

import { useMemo, useState } from "react";

type GenItem = { bloc: number; combinaison: number[]; etoile: boolean };
type GenSuccess = { ok: true; data: GenItem[]; [k: string]: unknown };
type GenError   = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = GenSuccess | GenError;

function Chip({
  n,
  variant = "base",
}: {
  n: number;
  variant?: "base" | "star-reuse" | "star-new";
}) {
  const cls =
    variant === "star-reuse"
      ? "bg-red-50 border-red-300 text-red-700"
      : variant === "star-new"
      ? "bg-blue-50 border-blue-300 text-blue-700"
      : "bg-gray-50 border-gray-300 text-gray-800";
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium border ${cls}`}>
      {n.toString().padStart(2, "0")}
    </span>
  );
}

export default function GenerateurGb({ loterieId }: { loterieId: string }) {
  const [blocsCount, setBlocsCount] = useState(1);
  const [result, setResult] = useState<ApiResponse | string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!result || typeof result === "string" || !("ok" in result) || !result.ok)
      return new Map<number, GenItem[]>();
    const map = new Map<number, GenItem[]>();
    for (const it of result.data as GenItem[]) {
      if (!map.has(it.bloc)) map.set(it.bloc, []);
      map.get(it.bloc)!.push(it);
    }
    for (const [k, arr] of map) {
      arr.sort((a, b) => Number(a.etoile) - Number(b.etoile)); // bases avant étoile
      map.set(k, arr);
    }
    return map;
  }, [result]);

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
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {/* Un seul bloc par rangée (vertical) */}
      {grouped.size > 0 && (
        <div className="space-y-4">
          {[...grouped.entries()].map(([blocId, items]) => {
            const bases = items.filter((i) => !i.etoile);
            const star = items.find((i) => i.etoile);
            const baseNums = new Set(bases.flatMap((b) => b.combinaison));
            const starReuse = star ? star.combinaison.filter((n) => baseNums.has(n)) : [];
            const starNew = star ? star.combinaison.filter((n) => !baseNums.has(n)) : [];
            return (
              <div key={blocId} className="rounded-xl border p-3">
                <div className="mb-2 font-semibold">Bloc {blocId}</div>
                <div className="grid gap-2">
                  {bases.map((it, idx) => (
                    <div key={idx} className="flex flex-wrap gap-1">
                      {it.combinaison.map((n) => (
                        <Chip key={n} n={n} />
                      ))}
                    </div>
                  ))}

                  {star && (
                    <div className="mt-1">
                      <div className="text-xs font-medium mb-1">★ Étoile</div>
                      <div className="flex flex-wrap gap-1">
                        {starReuse.map((n) => (
                          <Chip key={`r-${n}`} n={n} variant="star-reuse" />
                        ))}
                        {starNew.map((n) => (
                          <Chip key={`n-${n}`} n={n} variant="star-new" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
