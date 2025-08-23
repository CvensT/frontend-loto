"use client";

import { useMemo, useState } from "react";

type ApiSuccess = {
  ok: true;
  data: { existe: boolean; criteres?: Record<string, unknown> };
};
type ApiError = { ok: false; error: string; [k: string]: unknown };
type ApiResponse = ApiSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, min: 1, max: 49, somme: [80, 179] as [number, number] },
  "2": { name: "Lotto Max",  numsPerComb: 7, min: 1, max: 50, somme: [140, 219] as [number, number] },
  "3": { name: "Lotto 6/49", numsPerComb: 6, min: 1, max: 49, somme: [100, 199] as [number, number] },
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

  // largeurs
  const widths = headers.map((h, c) =>
    Math.max(h.length, ...data.map((row) => row[c].length))
  );

  const sep = "-".repeat(widths.reduce((acc, w, i) => acc + w + (i ? 3 : 0), 0));
  const line = (cols: string[]) =>
    cols.map((s, i) => padRight(s, widths[i])).join(" | ");

  let out = "";
  out += line(headers) + "\n";
  out += sep + "\n";
  for (const row of data) out += line(row) + "\n";
  return out.trimEnd();
}

function parseLines(text: string, expected: number, min: number, max: number): number[][] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Entrez au moins une combinaison.");
  if (lines.length > 10) throw new Error("Maximum 10 lignes.");
  const out: number[][] = [];
  for (const l of lines) {
    const nums = l.replace(/[;,]+/g, " ").split(/\s+/).map((t) => parseInt(t, 10)).filter(Number.isFinite);
    if (nums.length !== expected) throw new Error(`"${l}" → ${expected} nombres requis.`);
    if (new Set(nums).size !== nums.length) throw new Error(`"${l}" → pas de doublons.`);
    const oob = nums.filter((n) => n < min || n > max);
    if (oob.length) throw new Error(`"${l}" → hors plage [${min}–${max}] : ${oob.join(", ")}`);
    out.push([...nums].sort((a, b) => a - b));
  }
  return out;
}

export default function VerificationCombinaison({ loterieId }: { loterieId: string }) {
  const cfg = CFG[(loterieId as keyof typeof CFG) ?? "2"];
  const [text, setText] = useState("");
  const [ascii, setAscii] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const aide = useMemo(
    () =>
      `Collez 1 à 10 lignes — ${cfg.numsPerComb} nombres distincts entre ${cfg.min} et ${cfg.max} (ex: ${cfg.name === "Lotto Max" ? "1 8 14 20 27 38 45" : cfg.name === "Grande Vie" ? "1 9 17 25 33" : "2 8 16 31 38 41"}).`,
    [cfg]
  );

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setAscii("");
    try {
      const combos = parseLines(text, cfg.numsPerComb, cfg.min, cfg.max);

      const rows: Array<{ comb: number[]; checks: Record<string, boolean>; sommeRange: [number, number] }> = [];
      for (const comb of combos) {
        const r = await fetch("/api/verifier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loterie: loterieId, combinaison: comb }),
          cache: "no-store",
        });
        const t = await r.text();
        const parsed: ApiResponse = (() => {
          try {
            return JSON.parse(t) as ApiResponse;
          } catch {
            return { ok: false, error: t || "Réponse invalide" };
          }
        })();

        if (!parsed.ok || !parsed.data.criteres || typeof parsed.data.criteres !== "object") {
          throw new Error(!parsed.ok ? parsed.error : "Réponse sans critères");
        }

        rows.push({
          comb,
          checks: parsed.data.criteres as Record<string, boolean>,
          sommeRange: cfg.somme,
        });
      }

      const table = "Bloc 1 :\n" + buildAsciiTable(rows);
      setAscii(table);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="font-semibold">V — Vérifier si combinaison existe</h3>
      <div className="text-sm text-gray-600">Loterie <b>{cfg.name}</b>. {aide}</div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.max(3, Math.min(10, text.split(/\n/).length || 3))}
        className="w-full border rounded p-2 font-mono text-sm"
        placeholder={"1 2 3 ... (une ligne = une combinaison)"}
      />

      <button onClick={submit} disabled={loading} className="px-3 py-2 rounded-xl border">
        {loading ? "Vérification..." : "Vérifier"}
      </button>

      {err && <pre className="text-red-600 text-sm whitespace-pre-wrap">{err}</pre>}

      {ascii && (
        <pre className="font-mono text-sm bg-gray-50 border rounded p-3 whitespace-pre overflow-x-auto">
{ascii}
        </pre>
      )}
    </div>
  );
}
