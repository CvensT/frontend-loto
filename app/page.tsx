"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
import VerificationBlocs from "../components/VerificationBlocs";

type Action = "" | "Gb" | "V" | "Vb";
type LId = "1" | "2" | "3";

export default function Page() {
  // Accueil par défaut (action vide) + loterie contrôlée ici
  const [action, setAction] = useState<Action>("");
  const [loterieId, setLoterieId] = useState<LId>("2");

  const renderContent = () => {
    switch (action) {
      case "Gb":
        return <GenerateurGb loterieId={loterieId} />;
      case "V":
        return <VerificationCombinaison loterieId={loterieId} />;
      case "Vb":
        return <VerificationBlocs loterieId={loterieId} />;
      default:
        return null; // accueil: seulement le menu
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-6 space-y-6">
      <h1 className="text-3xl font-bold">🎲 AI Générateur de Combinaisons</h1>

      {/* Le menu contrôle TOUT (loterie + action). */}
      <MenuPrincipal
        loterieId={loterieId}
        onChangeLoterie={(id) => {
          setLoterieId(id);
          setAction(""); // changer de loterie => retour accueil
        }}
        action={action as Exclude<Action, ""> as "Gb" | "V" | "Vb"}
        onChangeAction={(a) => setAction(a)}
      />

      {renderContent()}

      {action !== "" ? (
        <button
          type="button"
          className="border rounded px-3 py-1 text-xs"
          onClick={() => setAction("")}
        >
          ⬅️ Accueil
        </button>
      ) : null}
    </main>
  );
}
