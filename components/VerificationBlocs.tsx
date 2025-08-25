"use client";

import { useEffect, useMemo, useState } from "react";

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
  "1": { name: "Grande Vie", numsPerComb: 5, baseCount: 9,  somme: [80, 179]  as [number, number] },
  "2": { name: "Lotto Max",  numsPerComb: 7, baseCount: 7,  somme: [140, 219] as [number, number] },
  "3": { name: "Lotto 6/49", numsPerComb: 6, baseCount: 8,  somme: [100, 199] as [number, number] },
} as const;

const KEYS = [
  "Pair/Impair", "Petit/Grand", "Séries", "Dizaines",
  "Fin identique", "Diversité finales", "Symboliques", "Somme",
] as const;

const TICK = "✔";
const CROSS = "✗";

/* helpers */
const fmtComb = (nums: number[]) => nums.map((n) => n.toString().padStart(2, "0")).join(" ");
const fmtList = (nums: number[]) => nums.map((n) => n.toString().padStart(2, "0")).join(", ");
const padRight = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));

function buildAsciiTable(rows: Array<{ comb: number[]; checks: Record<string, boolean>; sommeRange: [number, number]; }>) {
  const sommeLabel = `Somme : ${rows[0]?.sommeRange?.[0] ?? "?"} - ${rows[0]?.sommeRange?.[1] ?? "?"}`;
  const headers = ["Combinaison", ...KEYS.slice(0, -1), sommeLabel];
  const data = rows.map((r) => {
    const sum = r.comb.reduce((a, b) => a + b, 0);
    return [
      fmtComb(r.comb),
      ...KEYS.slice(0, -1).map((k) => (r.checks[k] ? TICK : CROSS)),
      `${r.checks["Somme"] ? TICK : CROSS} (${sum})`,
    ];
  });
  const widths = headers.map((_, c) => Math.max(headers[c].length, ...(data.map(row => row[c].length))));
  const sep  = widths.map((w) => "-".repeat(w)).join(" | ");
  const line = (cols: string[]) => cols.map((s, i) => padRight(s, widths[i])).join(" | ");
  return [line(headers), sep, ...data.map(line)].join("\n");
}

function parseBlockText(text: string, numsPerComb: number) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const block: number[][] = [];
  for (const l of lines) {
    const nums = l.replace(/[;,]+/g, " ").split(/\s+/).map((t) => parseInt(t, 10)).filter(Number.isFinite);
    if (nums.length !== numsPerComb) throw new Error(`Chaque ligne doit avoir ${numsPerComb} nombres. Ligne : « ${l} »`);
    block.push([...nums].sort((a, b) => a - b));
  }
  return block;
}

/* ======================== composant Vb densifié ======================== */
export default function VerificationBlocs({ loterieId }: { loterieId: "1" | "2" | "3" }) {
  const cfg = CFG[loterieId];
  const baseCount = cfg.baseCount;
  const numsPerComb = cfg.numsPerComb;
  const expectedTotal = baseCount + 1; // base + étoile (dernière ligne)

  const [showEditor, setShowEditor] = useState(true);
  const [blocText, setBlocText] = useState("");
  const [ascii, setAscii] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowEditor(true);
    setAscii("");
    setErr(null);
    setBlocText("");
  }, [loterieId]);

  const placeholder = useMemo(
    () =>
      Array.from({ length: expectedTotal }, (_, i) =>
        Array.from({ length: numsPerComb }, (_, j) => i * numsPerComb + j + 1).join(" ")
      ).join("\n"),
    [expectedTotal, numsPerComb]
  );

  const submit = async () => {
    setAscii(""); setErr(null); setLoading(true);
    try {
      const parsed = parseBlockText(blocText, numsPerComb);
      if (parsed.length !== expectedTotal) throw new Error(`Il faut ${expectedTotal} lignes (base ${baseCount} + 1 étoile).`);

      const etoileIndex = parsed.length - 1;

      const r = await fetch("/api/verifier-bloc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loterie: loterieId, bloc: parsed, etoileIndex }),
      });
      const text = await r.text();
      let data: ApiResponse;
      try { data = JSON.parse(text); } catch { throw new Error("Réponse du serveur invalide."); }
      if (!data.ok) throw new Error(data.error || "Erreur serveur");

      const rows = data.data.details.map((obj, i) => {
        const comb = Array.isArray(obj["Combinaison"]) ? (obj["Combinaison"] as number[]) : parsed[i];
        const checks: Record<string, boolean> = {};
        for (const k of KEYS) checks[k] = typeof obj[k] === "boolean" ? (obj[k] as boolean) : false;
        return { comb, checks, sommeRange: cfg.somme };
      });

      const baseIdxs  = parsed.map((_, i) => i).filter((i) => i !== etoileIndex);
      const baseCombs = baseIdxs.map((i) => parsed[i]);
      const starComb  = parsed[etoileIndex];

      const counts = new Map<number, number>();
      for (const comb of baseCombs) for (const n of comb) counts.set(n, (counts.get(n) || 0) + 1);
      const doublons = [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n).sort((a, b) => a - b);

      const baseSet = new Set<number>(baseCombs.flat());
      const reutilises = starComb.filter((n) => baseSet.has(n)).sort((a, b) => a - b);
      const nouveaux  = starComb.filter((n) => !baseSet.has(n)).sort((a, b) => a - b);

      const blocHead = `Bloc 1 :`;
      const table    = buildAsciiTable(rows);
      const line1    = doublons.length === 0
        ? "👍 Aucun doublon détecté dans les combinaisons de base."
        : `⚠️ Doublons détectés dans les combinaisons de base : [${fmtList(doublons)}]`;
      const line2    = `🔷 Numéros réutilisés dans la combinaison étoile : [${fmtList(reutilises)}]`;
      const line3    = `⚠️ Numéros nouveaux (restants) dans la combinaison étoile : [${fmtList(nouveaux)}]`;

      setAscii(`${blocHead}\n${table}\n\n${line1}\n\n${line2}\n\n${line3}`);
      setShowEditor(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-2 sm:p-3 space-y-2 text-[13px] w-fit">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[13px]">
          Vb — Vérifier couverture de blocs / {cfg.name} : {baseCount} + 1*
        </h3>
        <button
          type="button"
          onClick={() => setShowEditor((v) => !v)}
          className="text-[12px] underline decoration-dotted"
        >
          {showEditor ? "Masquer le bloc" : "✎ Saisir le bloc"}
        </button>
      </div>

      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <button
            onClick={submit}
            disabled={loading || !blocText.trim()}
            className="px-2.5 py-1.5 rounded-lg border"
            title={blocText.trim() ? "Vérifier" : "Collez un bloc (via Saisir le bloc) puis vérifiez"}
          >
            {loading ? "..." : "Vérifier"}
          </button>
          <div className="px-2.5 py-1.5 rounded-lg border bg-white text-gray-700 select-none">
            Nb attendu&nbsp;: {expectedTotal}
          </div>
        </div>
      </div>

      {showEditor && (
        <textarea
          value={blocText}
          onChange={(e) => setBlocText(e.target.value)}
          rows={Math.max(6, expectedTotal)}
          placeholder={placeholder}
          className="w-full border rounded p-2 font-mono text-[12px] leading-[1.2]"
        />
      )}

      {err && <div className="text-red-600 text-[12px]">{err}</div>}

      {ascii && (
        <pre className="font-mono tabular-nums text-[11px] leading-[1.25] bg-gray-50 border rounded p-2 whitespace-pre inline-block">
{ascii}
        </pre>
      )}
    </div>
  );
}
