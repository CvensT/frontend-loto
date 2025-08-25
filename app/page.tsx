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
    <main className="min-h-screen py-4">
      <div className="mx-auto w-fit px-3 space-y-4">
        <h1 className="text-xl font-semibold">🎲 AI Générateur de Combinaisons</h1>

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

        <div className="w-fit">{renderContent()}</div>

        {action !== "" && (
          <div className="pt-2">
            <button
              type="button"
              className="border rounded px-3 py-1 text-xs"
              onClick={() => setAction("")}
            >
              ⬅️ Accueil
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

