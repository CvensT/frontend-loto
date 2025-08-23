"use client";

import { useMemo, useState } from "react";

type VerifierBlocSuccess = { ok: true; data: { valide: boolean; erreurs: string[]; details: unknown } };
type ApiError           = { ok: false; error: string; [k: string]: unknown };
type ApiResponse        = VerifierBlocSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, baseCount: 9, somme: [80, 179] as [number, number] },
  "2": { name: "Lotto Max",  numsPerComb: 7, baseCount: 7, somme: [140, 219] as [number, number] },
  "3": { name: "Lotto 6/49", numsPerComb: 6, baseCount: 8, somme: [100, 199] as [number, number] },
} as const;

const TICK = "✔";
const CROSS = "✗";

function fmtComb(nums: number[]) {
  return nums.map((n) => n.toString().padStart(2, "0")).join(" ");
}
function padRight(s: string, w: number) {
  return s + " ".repeat(Math.max(0, w - s.length));
}
function buildAsciiTable(rows: Array<{
  comb: number[];
  checks: Record<string, boolean>;
  sommeRange: [number, number];
}>) {
  const headers = [
    "No",
    "Combinaison",
    "Pair/Impair",
    "Petit/Grand",
    "Séries",
    "Dizaines",
    "Fin id.",
    "Diversité",
    "Symboliques",
    `Somme : ${rows[0]?.sommeRange[0] ?? "?"} - ${rows[0]?.sommeRange[1] ?? "?"}`,
  ];
  const data = rows.map((r, i) => [
    `${String(i + 1).padStart(2, "0")}.`,
    fmtComb(r.comb),
    r.checks["Pair/Impair"] ? TICK : CROSS,
    r.checks["Petit/Grand"] ? TICK : CROSS,
    r.checks["Séries"] ? TICK : CROSS,
    r.checks["Dizaines"] ? TICK : CROSS,
    r.checks["Fin identique"] ? TICK : CROSS,
    r.checks["Diversité finales"] ? TICK : CROSS,
    r.checks["Symboliques"] ? TICK : CROSS,
    `${r.checks["Somme"] ? TICK : CROSS} (${String(r.comb.reduce((a, b) => a + b, 0))})`,
  ]);
  const widths = headers.map((h, c) => Math.max(h.length, ...data.map((row) => row[c].length)));
  const sep = "-".repeat(widths.reduce((acc, w, i) => acc + w + (i ? 3 : 0), 0));
  const line = (cols: string[]) => cols.map((s, i) => padRight(s, widths[i])).join(" | ");
  let out = "";
  out += line(headers) + "\n";
  out += sep + "\n";
  for (const row of data) out += line(row) + "\n";
  return out.trimEnd();
}

function parseBlockText(text: string, numsPerComb: number) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const block: number[][] = [];
  for (const l of lines) {
    const nums = l.replace(/[;,]+/g, " ").split(/\s+/).map((t) => parseInt(t, 10)).filter(Number.isFinite);
    if (nums.length !== numsPerComb) throw new Error(`Chaque ligne doit contenir ${numsPerComb} nombres — "${l}"`);
    block.push([...nums].sort((a, b) => a - b));
  }
  return block;
}

export default function VerificationBlocs({ loterieId }: { loterieId: string }) {
  const cfg = CFG[(loterieId as keyof typeof CFG) ?? "2"];
  const expectedTotal = cfg.baseCount + 1;

  const [blocText, setBlocText] = useState("");
  const [etoileIndex, setEtoileIndex] = useState(cfg.baseCount);
  const [ascii, setAscii] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(() => {
    const sample: number[][] =
      loterieId === "2"
        ? [
            [3,10,15,17,24,36,47],
            [5,14,18,25,42,45,46],
            [1,2,26,27,31,38,44],
            [9,12,21,23,40,41,43],
            [4,8,13,33,35,37,39],
            [6,7,16,19,28,34,50],
            [11,20,22,29,30,48,49],
            [11,12,25,28,29,32,39] // étoile
          ]
        : Array.from({ length: expectedTotal }, () => Array.from({ length: cfg.numsPerComb }, (_, i) => i + 1));
    return sample.map((row) => row.join(" ")).join("\n");
  }, [loterieId]);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setAscii("");
    try {
      const parsed = parseBlockText(blocText, cfg.numsPerComb);
      if (parsed.length !== expectedTotal) throw new Error(`Il faut ${expectedTotal} lignes (base ${cfg.baseCount} + 1 étoile).`);
      if (etoileIndex < 0 || etoileIndex >= parsed.length) throw new Error(`etoileIndex doit être entre 0 et ${parsed.length - 1}.`);

      // Doublons base + réutilisés/nouveaux étoile (analyse locale, comme ton script)
      const baseIdx = parsed.map((_, i) => i).filter((i) => i !== etoileIndex);
      const counts: Record<number, number> = {};
      for (const i of baseIdx) for (const n of parsed[i]) counts[n] = (counts[n] ?? 0) + 1;
      const dups = Object.keys(counts).map(Number).filter((n) => counts[n] > 1).sort((a, b) => a - b);

      const starSet = new Set(parsed[etoileIndex]);
      const baseSet = new Set(baseIdx.flatMap((i) => parsed[i]));
      const reused = [...starSet].filter((n) => baseSet.has(n)).sort((a, b) => a - b);
      const nouveau = [...starSet].filter((n) => !baseSet.has(n)).sort((a, b) => a - b);

      // Backend pour les critères (une ligne par combinaison)
      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc: parsed, etoileIndex }),
        cache: "no-store",
      });
      const t = await r.text();
      const parsedResp: ApiResponse = (() => {
        try { return JSON.parse(t) as ApiResponse; } catch { return { ok: false, error: t || "Réponse invalide" }; }
      })();
      if (!parsedResp.ok || !Array.isArray(parsedResp.data.details)) {
        throw new Error(!parsedResp.ok ? parsedResp.error : "Réponse sans détails");
      }

      const details = parsedResp.data.details as Array<Record<string, unknown>>;
      const rows = details.map((obj, i) => {
        const comb = (obj["Combinaison"] as number[]) ?? parsed[i];
        return { comb, checks: obj as Record<string, boolean>, sommeRange: cfg.somme };
      });

      const table = "Bloc 1 :\n" + buildAsciiTable(rows);

      const recap =
        "\n\n" +
        (dups.length
          ? `🚨 Doublons détectés dans les combinaisons de base : [${dups.join(", ")}]\n`
          : "👍 Aucun doublon détecté dans les combinaisons de base.\n") +
        `\n🔄 Numéros réutilisés dans la combinaison étoile : [${reused.join(", ")}]\n` +
        `⚠️  Numéros nouveaux (restants) dans la combinaison étoile : [${nouveau.join(", ")}]`;

      setAscii(table + recap);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Vb — Vérifier couverture de blocs (base + étoile)</h3>
      <div className="text-sm text-gray-600">
        Loterie <b>{cfg.name}</b> — {cfg.baseCount} combinaisons de base + 1 étoile.
      </div>

      <textarea
        value={blocText}
        onChange={(e) => setBlocText(e.target.value)}
        rows={Math.max(8, expectedTotal + 2)}
        placeholder={placeholder}
        className="w-full border rounded p-2 font-mono text-sm"
      />

      <div className="flex items-center gap-3">
        <label className="text-sm">Index de l’étoile</label>
        <input
          type="number"
          min={0}
          max={expectedTotal - 1}
          value={etoileIndex}
          onChange={(e) => {
            const v = parseInt(e.target.value || String(cfg.baseCount), 10);
            const clamped = Number.isFinite(v) ? Math.max(0, Math.min(expectedTotal - 1, v)) : cfg.baseCount;
            setEtoileIndex(clamped);
          }}
          className="border rounded px-2 py-1 w-24"
        />
        <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
          {loading ? "Vérification..." : "Vérifier"}
        </button>
      </div>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {ascii && (
        <pre className="font-mono text-sm bg-gray-50 border rounded p-3 whitespace-pre overflow-x-auto">
{ascii}
        </pre>
      )}
    </div>
  );
}
