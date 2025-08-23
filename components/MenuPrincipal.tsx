"use client";

import { useState } from "react";

type Action = "Gb" | "V" | "Vb";
type Selection = { loterieId: string; action: Action };

const LOTERIES = [
  { id: "1", label: "Grande Vie" },
  { id: "2", label: "Lotto Max" },
  { id: "3", label: "Lotto 6/49" },
] as const;

export default function MenuPrincipal({
  onChange,
  defaultLoterieId = "2",
}: {
  onChange: (s: Selection) => void;
  defaultLoterieId?: string;
}) {
  const [loterieId, setLoterieId] = useState<string>(defaultLoterieId);

  const choisir = (action: Action) => onChange({ loterieId, action });

  return (
    <div className="rounded-2xl border p-4 sm:p-6 space-y-3">
      <h2 className="text-lg font-semibold">🎯 Menu principal</h2>

      <div className="flex items-center gap-3">
        <label htmlFor="loterie" className="text-sm">Loterie</label>
        <select
          id="loterie"
          className="border rounded px-2 py-1"
          value={loterieId}
          onChange={(e) => setLoterieId(e.target.value)}
        >
          {LOTERIES.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="text-sm leading-relaxed">
        <div>(Gb) Génération par blocs couvrants (+ étoile)</div>
        <div>(V)  Vérifier si combinaison existe</div>
        <div>(Vb) Vérifier couverture de blocs (format forcé base+étoile)</div>
      </div>

      <div className="pt-2 flex gap-2">
        <button onClick={() => choisir("Gb")} className="px-3 py-2 rounded-xl border">Gb</button>
        <button onClick={() => choisir("V")}  className="px-3 py-2 rounded-xl border">V</button>
        <button onClick={() => choisir("Vb")} className="px-3 py-2 rounded-xl border">Vb</button>
      </div>

      <p className="pt-1 text-sm">
        👉 Que voulez-vous faire ? <span className="font-mono">[Gb/V/Vb]</span>
      </p>
    </div>
  );
}
