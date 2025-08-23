"use client";

import { useMemo, useState } from "react";

type VerifierBlocSuccess = {
  ok: true;
  data: {
    valide: boolean;
    erreurs: string[];
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

const KEYS = [
  "Pair/Impair", "Petit/Grand", "Séries", "Dizaines",
  "Fin identique", "Diversité finales", "Symboliques", "Somme",
] as const;

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
  const sommeLabel = `Somme : ${rows[0]?.sommeRange?.[0] ?? "?"} - ${rows[0]?.sommeRange?.[1] ?? "?"}`;
  const headers = ["No", "Combinaison", ...KEYS.slice(0, -1), "Symboliques", sommeLabel];

  const data = rows.map((r, i) => {
    const sum = r.comb.reduce((a, b) => a + b, 0);
    return [
      `${String(i + 1).padStart(2, "0")}.`,
      fmtComb(r.comb),
      ...KEYS.slice(0, -1).map((k) => r.checks[k] ? TICK : CROSS),
      r.checks["Symboliques"] ? TICK : CROSS,
      `${r.checks["Somme"] ? TICK : CROSS} (${sum})`,
    ];
  });

  const widths = headers.map((_, c) =>
    Math.max(headers[c].length, ...(data.map(row => row[c].length)))
  );

  const sep = widths.map((w) => "-".repeat(w)).join(" | ");
  const line = (cols: string[]) => cols.map((s, i) => padRight(s, widths[i])).join(" | ");

  return [
    line(headers),
    sep,
    ...data.map(line),
  ].join("\n");
}

function parseBlockText(text: string, numsPerComb: number) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const block: number[][] = [];

  for (const l of lines) {
    const nums = l
      .replace(/[;,]+/g, " ")
      .split(/\s+/)
      .map((t) => parseInt(t, 10))
      .filter(Number.isFinite);

    if (nums.length !== numsPerComb) {
      throw new Error(`Chaque ligne doit avoir ${numsPerComb} nombres. Ligne : « ${l} »`);
    }

    block.push([...nums].sort((a, b) => a - b));
  }

  return block;
}

export default function VerificationBlocs({ loterieId }: { loterieId: "1" | "2" | "3" }) {
  const cfg = CFG[loterieId];
  const baseCount = cfg.baseCount;
  const numsPerComb = cfg.numsPerComb;
  const expectedTotal = baseCount + 1;

  const [blocText, setBlocText] = useState("");
  const [etoileIndex, setEtoileIndex] = useState(baseCount);
  const [ascii, setAscii] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(() => {
    return Array.from({ length: expectedTotal }, (_, i) =>
      Array.from({ length: numsPerComb }, (_, j) => i * numsPerComb + j + 1).join(" ")
    ).join("\n");
  }, [expectedTotal, numsPerComb]);

  const submit = async () => {
    setAscii("");
    setErr(null);
    setLoading(true);
    try {
      const parsed = parseBlockText(blocText, numsPerComb);

      if (parsed.length !== expectedTotal) {
        throw new Error(`Il faut ${expectedTotal} lignes (base ${baseCount} + 1 étoile).`);
      }
      if (etoileIndex < 0 || etoileIndex >= parsed.length) {
        throw new Error(`Index étoile invalide (doit être entre 0 et ${parsed.length - 1}).`);
      }

      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc: parsed, etoileIndex }),
      });

      const text = await r.text();
      let data: ApiResponse;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Réponse du serveur invalide.");
      }

      if (!data.ok) throw new Error(data.error || "Erreur serveur");

      const rows = data.data.details.map((obj, i) => {
        const comb = Array.isArray(obj["Combinaison"]) ? obj["Combinaison"] as number[] : parsed[i];
        const checks: Record<string, boolean> = {};
        for (const k of KEYS) {
          checks[k] = typeof obj[k] === "boolean" ? obj[k] as boolean : false;
        }
        return { comb, checks, sommeRange: cfg.somme };
      });

      setAscii("Bloc 1 :\n" + buildAsciiTable(rows));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">Vb — Vérifier couverture de blocs (base + étoile)</h3>
      <div className="text-sm text-gray-600">
        Loterie : <b>{cfg.name}</b> — {baseCount} combinaisons + 1 étoile
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
          onChange={(e) => setEtoileIndex(Math.max(0, Math.min(expectedTotal - 1, parseInt(e.target.value || "0", 10))))}
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

