"use client";

import { useMemo, useState } from "react";

type ApiSuccess = { ok: true; data: { existe: boolean } };
type ApiError   = { ok: false; error: string };
type ApiResp    = ApiSuccess | ApiError;

const CFG = {
  "1": { name: "Grande Vie", numsPerComb: 5, min: 1, max: 49 },
  "2": { name: "Lotto Max",  numsPerComb: 7, min: 1, max: 50 },
  "3": { name: "Lotto 6/49", numsPerComb: 6, min: 1, max: 49 },
} as const;

function fmtComb(nums: number[]) {
  return nums.map((n) => n.toString().padStart(2, "0")).join(" ");
}
function padRight(s: string, w: number) {
  return s + " ".repeat(Math.max(0, w - s.length));
}
function buildTable(rows: Array<{ no: string; comb: string; statut: string }>) {
  const headers = ["No", "Combinaison", "Statut"];
  const data = rows.map((r) => [r.no, r.comb, r.statut]);
  const widths = headers.map((h, c) => Math.max(h.length, ...data.map((row) => row[c].length)));
  const sep = "-".repeat(widths.reduce((acc, w, i) => acc + w + (i ? 3 : 0), 0));
  const line = (cols: string[]) => cols.map((s, i) => padRight(s, widths[i])).join(" | ");

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
    () => `Collez 1 à 10 lignes — ${cfg.numsPerComb} nombres distincts entre ${cfg.min} et ${cfg.max}.`,
    [cfg]
  );

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setAscii("");
    try {
      const combos = parseLines(text, cfg.numsPerComb, cfg.min, cfg.max);

      const rows: Array<{ no: string; comb: string; statut: string }> = [];
      let idx = 1;

      for (const comb of combos) {
        const r = await fetch("/api/verifier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loterie: loterieId, combinaison: comb }),
          cache: "no-store",
        });
        const t = await r.text();
        let existe: boolean | null = null;

        try {
          const parsed: ApiResp = JSON.parse(t);
          if (parsed.ok) existe = !!parsed.data.existe;
          else throw new Error(parsed.error);
        } catch {
          // fallback: si le backend renvoie juste "true"/"false"
          if (t.trim().toLowerCase() === "true") existe = true;
          else if (t.trim().toLowerCase() === "false") existe = false;
          else throw new Error(t || "Réponse invalide du backend");
        }

        rows.push({
          no: `${String(idx++).padStart(2, "0")}.`,
          comb: fmtComb(comb),
          statut: existe ? "déjà tirée" : "nouvelle combinaison",
        });
      }

      const table = buildTable(rows);
      setAscii("Bloc 1 :\n" + table);
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
        placeholder={"ex. 1 8 14 20 27 38 45"}
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
