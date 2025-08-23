"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
import VerificationBlocs from "../components/VerificationBlocs";

type Action = "Gb" | "V" | "Vb";

export default function Page() {
  // source de vérité
  const [action, setAction] = useState<Action>("Vb");
  const [loterieId, setLoterieId] = useState<"1" | "2" | "3">("2");

  return (
    <main className="min-h-screen flex flex-col items-center p-6 space-y-6">
      <h1 className="text-3xl font-bold">🎲 AI Générateur de Combinaisons</h1>

      {/* ✅ Le menu contrôle TOUT (loterie + action). Aucun autre select au-dessus. */}
      <MenuPrincipal
        loterieId={loterieId}
        onChangeLoterie={setLoterieId}
        action={action}
        onChangeAction={setAction}
      />

      {/* Rendu conditionnel */}
      {action === "Gb" && <GenerateurGb loterieId={loterieId} />}
      {action === "V"  && <VerificationCombinaison loterieId={loterieId} />}
      {action === "Vb" && <VerificationBlocs loterieId={loterieId} />}
    </main>
  );
}
