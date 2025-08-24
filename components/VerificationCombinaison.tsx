"use client";

import { useEffect, useMemo, useState } from "react";

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5 },
  "2": { name: "Lotto Max",  numsPerComb: 7 },
  "3": { name: "Lotto 6/49", numsPerComb: 6 },
} as const;
type LId = keyof typeof CFG;

type ApiOk  = { ok: true;  data?: unknown; [k: string]: unknown };
type ApiErr = { ok: false; error: string; [k: string]: unknown };
type ApiResp = ApiOk | ApiErr;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseLine(line: string, expected: number): number[] {
  const nums = line
    .replace(/[;,]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => parseInt(t, 10))
    .filter(Number.isFinite);
  if (nums.length !== expected) throw new Error(`Chaque ligne doit contenir ${expected} nombres. « ${line} »`);
  return nums.sort((a, b) => a - b);
}
const fmtComb = (nums: number[]) => nums.map((n) => String(n).padStart(2, "0")).join(" ");

/** Interprète des formats de réponse variés ({found|existe|occurrences|count}...) */
function interpret(api: unknown): { found: boolean } {
  if (isRecord(api)) {
    const a = api as Record<string, unknown>;
    if (typeof a.found === "boolean") return { found: a.found };
    if (typeof a.existe === "boolean") return { found: a.existe };
    if (typeof a.occurrences === "number") return { found: a.occurrences > 0 };
    if (typeof a.count === "number") return { found: a.count > 0 };
  }
  const text = typeof api === "string" ? api : JSON.stringify(api);
  if (/AUCUNE\s+OCCURRENCE/i.test(text)) return { found: false };
  if (/OCCURRENCE|TIRÉE|TIRAGE/i.test(text)) return { found: true };
  return { found: false };
}

export default function VerifierCombinaisons({ loterieId }: { loterieId: LId }) {
  const cfg = CFG[loterieId];

  const [text, setText] = useState("");
  const [rows, setRows] = useState<{ comb: number[]; ok?: boolean; error?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(true);

  useEffect(() => {
    setShowEditor(true);
    setRows([]);
    setErr(null);
    setText("");
  }, [loterieId]);

  const placeholder = useMemo(() => {
    return [
      Array.from({ length: cfg.numsPerComb }, (_, i) => i + 1).join(" "),
      Array.from({ length: cfg.numsPerComb }, (_, i) => i + 11).join(" "),
      Array.from({ length: cfg.numsPerComb }, (_, i) => i + 21).join(" "),
    ].join("\n");
  }, [cfg.numsPerComb]);

  async function onVerify() {
    setErr(null);
    setRows([]);
    setLoading(true);
    try {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) throw new Error("Collez une ou plusieurs combinaisons (une par ligne).");
      const combs = lines.map((l) => parseLine(l, cfg.numsPerComb));

      const results: { comb: number[]; ok?: boolean; error?: string }[] = [];
      for (const comb of combs) {
        try {
          const r = await fetch("/api/verifier", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loterie: loterieId, combinaison: comb }),
          });
          const txt = await r.text();

          let data: ApiResp;
          try {
            const parsed = JSON.parse(txt) as unknown;
            if (isRecord(parsed) && "ok" in parsed) {
              data = parsed as ApiResp;
            } else {
              data = { ok: true, data: parsed } as ApiOk;
            }
          } catch {
            data = { ok: true, data: txt } as ApiOk;
          }

          if (!("ok" in data) || data.ok !== true) {
            const errMsg =
              (isRecord(data) && typeof (data as ApiErr).error === "string")
                ? (data as ApiErr).error
                : `Erreur ${r.status}`;
            results.push({ comb, error: errMsg });
          } else {
            const payload = (data as ApiOk).data ?? data;
            const { found } = interpret(payload);
            results.push({ comb, ok: found });
          }
        } catch (e: unknown) {
          const err = e instanceof Error ? e.message : String(e);
          results.push({ comb, error: err || "Erreur" });
        }
      }

      setRows(results);
      setShowEditor(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setText("");
    setRows([]);
    setErr(null);
    setShowEditor(true);
  }

  const deja   = rows.filter(r => r.error == null && r.ok === true);
  const jamais = rows.filter(r => r.error == null && r.ok === false);
  const fails  = rows.filter(r => r.error != null);

  return (
    <div className="rounded-lg border p-2 sm:p-3 space-y-2 text-[13px]">
      {/* Titre + toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[13px]">
          V — Vérifier si combinaisons déjà tirées / {cfg.name}
        </h3>
        <button
          type="button"
          onClick={() => setShowEditor(v => !v)}
          className="text-[12px] underline decoration-dotted"
        >
          {showEditor ? "Masquer" : "✎ Saisir les combinaisons"}
        </button>
      </div>

      {/* Éditeur compact (seulement si visible) */}
      {showEditor && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={placeholder}
            className="w-full border rounded p-2 font-mono text-[12px] leading-[1.2]"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onVerify}
              disabled={loading || !text.trim()}
              className="px-2.5 py-1.5 rounded-lg border text-[12px]"
            >
              {loading ? "..." : "Vérifier"}
            </button>
            <button onClick={onReset} className="px-2.5 py-1.5 rounded-lg border text-[12px]">
              Réinitialiser
            </button>
          </div>
        </>
      )}

      {err && <div className="text-red-600 text-[12px]">{err}</div>}

      {/* Résultats ultra-compacts : titres dans les coins + barre verticale */}
      {rows.length > 0 && (
        <div className="border rounded p-2 font-mono text-[12px] leading-tight">
          {/* titres en coins */}
          <div className="grid grid-cols-2 items-start">
            <div className="font-semibold">Déjà tirées : {deja.length}</div>
            <div className="font-semibold text-right">Jamais tirées : {jamais.length}</div>
          </div>

          {/* deux colonnes rapprochées séparées par une fine barre */}
          <div className="mt-1 grid grid-cols-2 divide-x divide-gray-300">
            <div className="pr-2 space-y-0.5">
              {deja.length === 0 ? (
                <div className="text-gray-500">—</div>
              ) : (
                deja.map((r, i) => <div key={`d-${i}`}>{fmtComb(r.comb)}</div>)
              )}
            </div>
            <div className="pl-2 space-y-0.5">
              {jamais.length === 0 ? (
                <div className="text-gray-500">—</div>
              ) : (
                jamais.map((r, i) => <div key={`j-${i}`}>{fmtComb(r.comb)}</div>)
              )}
            </div>
          </div>

          {/* erreurs (si besoin), toujours compact */}
          {fails.length > 0 && (
            <div className="mt-2 text-[11px]">
              <div className="font-semibold mb-1">Erreurs : {fails.length}</div>
              <div className="space-y-0.5">
                {fails.map((r, i) => (
                  <div key={`e-${i}`} className="flex gap-2">
                    <div className="w-[200px]">{fmtComb(r.comb)}</div>
                    <div>⚠️ {r.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
