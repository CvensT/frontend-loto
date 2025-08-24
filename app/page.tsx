"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
import VerificationBlocs from "../components/VerificationBlocs";

type Action = "" | "Gb" | "V" | "Vb";
type LoterieId = "1" | "2" | "3";

export default function Home() {
  // Loterie contrôlée au niveau page
  const [loterieId, setLoterieId] = useState<LoterieId>("2"); // défaut: Lotto Max
  const [action, setAction] = useState<Action>("");           // "" = accueil

  const goAccueil = () => setAction("");

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">🎲 IA Générateur de Combinaisons  🎲</h1>

      {/* MENU TOUJOURS EN HAUT */}
      <MenuPrincipal
        loterieId={loterieId}
        onChangeLoterie={(id) => { setLoterieId(id); setAction(""); }} // retour accueil si on change
        onAction={(a) => setAction(a)}
      />

      {/* CONTENU DYNAMIQUE */}
      {action === "Gb" && <GenerateurGb loterieId={loterieId} />}
      {action === "Vb" && <VerificationBlocs loterieId={loterieId} />}
      {action === "V"  && <VerificationCombinaison loterieId={loterieId} />}

      {/* Bouton Accueil dans chaque écran (affiché seulement si on n'est pas à l'accueil) */}
      {action && (
        <button
          onClick={goAccueil}
          className="mt-4 border rounded px-3 py-1 text-xs"
        >
          ⬅️ Accueil (changer d’option ou de loterie)
        </button>
      )}
    </div>
  );
}

