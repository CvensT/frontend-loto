"use client";

import { useMemo, useState } from "react";

type VerifierBlocSuccess = {
  ok: true;
  data: {
    valide: boolean;
    erreurs: string[];
    /** Tableau parallèle aux lignes soumises.
     * Chaque item peut contenir:
     * - Combinaison: number[]
     * - Booléens nommés exactement comme tes critères (see KEYS ci-dessous)
     */
    details: Array<Record<string, unknown>>;
  };
};
type ApiError = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = VerifierBlocSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, baseCount: 9, somme: [80, 179] as [number, number] },
  "2": { name: "Lotto Max", numsPerComb: 7, baseCount: 7, somme: [140, 219] as [number, number] },
  "3": { name: "Lotto 6/49", numsPerComb: 6, baseCount: 8, somme: [100, 199] as [number, number] },
} as const;

const TICK = "✔";
const CROSS = "✗";

/** Les libellés attendus dans `details[i]` côté backend */
const KEYS = [
  "Pair/Impair",
  "Petit/Grand",
  "Séries",
  "Dizaines",
  "Fin identique",
  "Diversité finales",
  "Symboliques",
  "Somme",
] as const;

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
  const sommeLabel = `Somme : ${rows[0]?.sommeRange?.[0] ?? "?"} - ${rows[0]?.sommeRange?.[1] ?? "?"}`;

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
    sommeLabel,
  ];

  const data = rows.map((r, i) => {
    const sum = r.comb.reduce((a, b) => a + b, 0);
    return [
      `${String(i + 1).padStart(2, "0")}.`,
      fmtComb(r.comb),
      r.checks["Pair/Impair"] ? TICK : CROSS,
      r.checks["Petit/Grand"] ? TICK : CROSS,
      r.checks["Séries"] ? TICK : CROSS,
      r.checks["Dizaines"] ? TICK : CROSS,
      r.checks["Fin identique"] ? TICK : CROSS,
      r.checks["Diversité finales"] ? TICK : CROSS,
      r.checks["Symboliques"] ? TICK : CROSS,
      `${r.checks["Somme"] ? TICK : CROSS} (${String(sum)})`,
    ];
  });

  // Largeurs de colonnes robustes
  const widths = headers.map((h, c) =>
    Math.max(h.length, ...(data.length ? data.map((row) => row[c].length) : [0]))
  );

  // ⚠️ Fix: retirer le paramètre i inutilisé
  const sep = widths.map((w) => "-".repeat(w)).join(" | ");
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
    const nums = l
      .replace(/[;,]+/g, " ")
      .split(/\s+/)
      .map((t) => Number.parseInt(t, 10))
      .filter((n) => Number.isFinite(n));
    if (nums.length !== numsPerComb) {
      throw new Error(`Chaque ligne doit contenir exactement ${numsPerComb} nombres — « ${l} »`);
    }
    block.push([...nums].sort((a, b) => a - b));
  }
  return block;
}

export default function VerificationBlocs({ loterieId }: { loterieId: "1" | "2" | "3" }) {
  const cfg = CFG[(loterieId as keyof typeof CFG) ?? "2"];
  const baseCount = Number(cfg.baseCount);
  const numsPerComb = Number(cfg.numsPerComb);
  const expectedTotal = baseCount + 1;

  const [blocText, setBlocText] = useState("");
  const [etoileIndex, setEtoileIndex] = useState<number>(baseCount);
  const [ascii, setAscii] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(() => {
    const total = baseCount + 1;
    const sample: number[][] =
      loterieId === "2"
        ? [
            [3, 10, 15, 17, 24, 36, 47],
            [5, 14, 18, 25, 42, 45, 46],
            [1, 2, 26, 27, 31, 38, 44],
            [9, 12, 21, 23, 40, 41, 43],
            [4, 8, 13, 33, 35, 37, 39],
            [6, 7, 16, 19, 28, 34, 50],
            [11, 20, 22, 29, 30, 48, 49],
            [11, 12, 25, 28, 29, 32, 39], // étoile
          ]
        : Array.from({ length: total }, () =>
            Array.from({ length: numsPerComb }, (_, i) => i + 1)
          );
    return sample.map((row) => row.join(" ")).join("\n");
  }, [loterieId, baseCount, numsPerComb]);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setAscii("");
    try {
      const parsed = parseBlockText(blocText, numsPerComb);

      if (parsed.length !== expectedTotal) {
        throw new Error(`Il faut ${expectedTotal} lignes (base ${baseCount} + 1 étoile). Lignes actuelles: ${parsed.length}`);
      }
      if (!(etoileIndex >= 0 && etoileIndex < parsed.length)) {
        throw new Error(`Index étoile invalide : ${etoileIndex} (autorisé: 0 à ${parsed.length - 1}).`);
      }

      // Doublons de NUMÉROS entre combinaisons de base
      const baseIdx = parsed.map((_, i) => i).filter((i) => i !== etoileIndex);
      const counts: Record<number, number> = {};
      for (const i of baseIdx) for (const n of parsed[i]) counts[n] = (counts[n] ?? 0) + 1;
      const dups = Object.keys(counts).map(Number).filter((n) => counts[n] > 1).sort((a, b) => a - b);

      // Etoile: réutilisés / nouveaux
      const starSet = new Set(parsed[etoileIndex]);
      const baseSet = new Set(baseIdx.flatMap((i) => parsed[i]));
      const reused = [...starSet].filter((n) => baseSet.has(n)).sort((a, b) => a - b);
      const nouveau = [...starSet].filter((n) => !baseSet.has(n)).sort((a, b) => a - b);

      // Appel backend
      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc: parsed, etoileIndex }),
        cache: "no-store",
      });

      const raw = await r.text();
      const resp: ApiResponse = (() => {
        try { return JSON.parse(raw) as ApiResponse; }
        catch { return { ok: false, error: raw || "Réponse invalide du serveur" }; }
      })();

      if (!resp.ok) throw new Error(resp.error ?? "Erreur serveur (verifier-bloc)");
      if (!Array.isArray(resp.data.details)) throw new Error("Réponse sans tableau 'details'.");

      // Normalisation des lignes pour l’affichage
      const details = resp.data.details as Array<Record<string, unknown>>;
      const rows = details.map((obj, i) => {
        const comb = Array.isArray(obj["Combinaison"])
          ? (obj["Combinaison"] as number[])
          : parsed[i];

        // Checks: prend les booléens s’ils existent, sinon false (évite trous dans le tableau)
        const checks: Record<string, boolean> = {};
        for (const k of KEYS) {
          checks[k] = typeof obj[k] === "boolean" ? (obj[k] as boolean) : false;
        }
        return { comb, checks, sommeRange: cfg.somme };
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
    } catch (e) {
      if (e instanceof Error) setErr(e.message);
      else setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Vb — Vérifier couverture de blocs (base + étoile)</h3>
      <div className="text-sm text-gray-600">
        Loterie <b>{cfg.name}</b> — {baseCount} combinaisons de base + 1 étoile.
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
            const v = Number.parseInt(e.target.value || String(baseCount), 10);
            const clamped = Number.isFinite(v) ? Math.max(0, Math.min(expectedTotal - 1, v)) : baseCount;
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

