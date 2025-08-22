"use client";

import { useState } from "react";

export default function MenuPrincipal({
  onChoix,
}: {
  onChoix: (loterie: string, mode: string) => void;
}) {
  const [loterie, setLoterie] = useState("2");
  const [mode, setMode] = useState("Gb");

  const handleSubmit = () => onChoix(loterie, mode);

  return (
    <div className="mb-6 flex flex-col items-center">
      <h1 className="mb-4 text-3xl font-bold">🎯 AI Générateur de Combinaisons</h1>

      <label htmlFor="loterie" className="mb-1 font-medium">Loterie :</label>
      <select
        id="loterie"
        value={loterie}
        onChange={(e) => setLoterie(e.target.value)}
        className="mb-4 rounded border border-gray-300 p-2"
      >
        <option value="2">Lotto Max</option>
        <option value="3">Lotto 6/49</option>
        <option value="1">Grande Vie</option>
      </select>

      <label htmlFor="mode" className="mb-1 font-medium">Mode :</label>
      <select
        id="mode"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="mb-4 rounded border border-gray-300 p-2"
      >
        <option value="Gb">Génération par blocs</option>
        <option value="V">Vérification combinaison</option>
        <option value="Vb">Vérification blocs</option>
      </select>

      <button onClick={handleSubmit} className="rounded bg-blue-500 px-4 py-2 text-white">
        Exécuter
      </button>
    </div>
  );
}
