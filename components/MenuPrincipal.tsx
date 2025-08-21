"use client";
import { useState } from "react";

export default function MenuPrincipal({
  onChoix,
}: {
  onChoix: (choix: { loterieId: string; action: string }) => void;
}) {
  const [loterie, setLoterie] = useState("2"); // Par défaut : Lotto Max
  const [action, setAction] = useState("Gb"); // Par défaut : génération par blocs

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChoix({ loterieId: loterie, action });
  };

  return (
    <div className="mb-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">🎯 AI Générateur de Combinaisons</h1>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div>
          <label htmlFor="loterie" className="block mb-1 font-medium">
            Sélectionnez une loterie :
          </label>
          <select
            id="loterie"
            value={loterie}
            onChange={(e) => setLoterie(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="2">Lotto Max</option>
            <option value="3">Lotto 6/49</option>
            <option value="1">Grande Vie</option>
          </select>
        </div>

        <div>
          <label htmlFor="action" className="block mb-1 font-medium">
            Action :
          </label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="Gb">🎲 Génération par Blocs</option>
            <option value="Gn">🔄 Génération Normale</option>
            <option value="V">🔍 Vérifier une combinaison</option>
            <option value="Vb">🧩 Vérifier un bloc</option>
            <option value="A">📊 Analyse de combinaison</option>
            <option value="H">📜 Voir historique</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Lancer
        </button>
      </form>
    </div>
  );
}
