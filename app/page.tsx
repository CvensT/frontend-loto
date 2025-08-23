"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
import VerificationBlocs from "../components/VerificationBlocs";

type Action = "Gb" | "V" | "Vb";

export default function Page() {
  const [action, setAction] = useState<Action | null>(null);
  const [loterieId, setLoterieId] = useState<string>("2"); // "1" GV, "2" Lotto Max, "3" 6/49

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
      <h1 className="text-3xl font-bold">🎲 AI Générateur de Combinaisons</h1>

      {/* Sélecteur de loterie */}
      <div className="flex items-center gap-2">
        <span>Sélectionnez une loterie :</span>
        <select
          value={loterieId}
          onChange={(e) => setLoterieId(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="1">Grande Vie</option>
          <option value="2">Lotto Max</option>
          <option value="3">Lotto 6/49</option>
        </select>
      </div>

      {/* Menu Gb / V / Vb */}
      <MenuPrincipal
        onChange={({ action }) => setAction(action)}
        defaultLoterieId={loterieId}
      />

      {/* Rendu conditionnel */}
      {action === "Gb" && <GenerateurGb loterieId={loterieId} />}
      {action === "V" && <VerificationCombinaison loterieId={loterieId} />}
      {action === "Vb" && <VerificationBlocs loterieId={loterieId} />}
    </main>
  );
}

