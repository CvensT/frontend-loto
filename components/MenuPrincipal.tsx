"use client";

import { useState, useEffect } from "react";

type Props = {
  loterieId: string;
  onChangeLoterie: (id: "1" | "2" | "3") => void;
  action: "Gb" | "V" | "Vb";
  onChangeAction: (a: "Gb" | "V" | "Vb") => void;
};

const LOTERIES = [
  { id: "1", nom: "Grande Vie" },
  { id: "2", nom: "Lotto Max" },
  { id: "3", nom: "Lotto 6/49" },
];

export default function MenuPrincipal({ loterieId, onChangeLoterie, action, onChangeAction }: Props) {
  const [localeLoterie, setLocaleLoterie] = useState(loterieId);

  useEffect(() => {
    onChangeLoterie(localeLoterie as "1" | "2" | "3");
  }, [localeLoterie]);

  return (
    <div className="rounded-xl border p-4 max-w-md w-full space-y-3">
      <div className="text-lg font-semibold">🎯 Menu principal</div>

      <label className="flex items-center gap-2">
        <span className="w-16 text-sm text-gray-700">Loterie</span>
        <select
          className="w-full rounded-xl border px-3 py-1"
          value={localeLoterie}
          onChange={(e) => setLocaleLoterie(e.target.value)}
        >
          {LOTERIES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nom}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onChangeAction("Gb")}
          className={`rounded-xl border px-3 py-2 hover:bg-gray-50 ${action === "Gb" ? "bg-gray-100 font-semibold" : ""}`}
        >
          (Gb) Génération par blocs couvrants (+ étoile)
        </button>
        <button
          onClick={() => onChangeAction("V")}
          className={`rounded-xl border px-3 py-2 hover:bg-gray-50 ${action === "V" ? "bg-gray-100 font-semibold" : ""}`}
        >
          (V) Vérifier si combinaison existe
        </button>
        <button
          onClick={() => onChangeAction("Vb")}
          className={`rounded-xl border px-3 py-2 hover:bg-gray-50 ${action === "Vb" ? "bg-gray-100 font-semibold" : ""}`}
        >
          (Vb) Vérifier couverture de blocs (format forcé base+étoile)
        </button>
      </div>

      <p className="text-sm text-gray-500 pt-2">👉 Que voulez-vous faire ? [ Gb / V / Vb ]</p>
    </div>
  );
}
