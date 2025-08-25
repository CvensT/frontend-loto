"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
import VerificationBlocs from "../components/VerificationBlocs";

type Action = "" | "Gb" | "V" | "Vb";
type LId = "1" | "2" | "3";

export default function Page() {
  const [action, setAction] = useState<Action>("");
  const [loterieId, setLoterieId] = useState<LId>("2");

  const render = () =>
    action === "Gb" ? (
      <GenerateurGb loterieId={loterieId} />
    ) : action === "V" ? (
      <VerificationCombinaison loterieId={loterieId} />
    ) : action === "Vb" ? (
      <VerificationBlocs loterieId={loterieId} />
    ) : null;

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          🎲 AI Générateur de Combinaisons
        </h1>

        <MenuPrincipal
          loterieId={loterieId}
          onChangeLoterie={(id) => {
            setLoterieId(id);
            setAction("");
          }}
          action={action as Exclude<Action, ""> as "Gb" | "V" | "Vb"}
          onChangeAction={setAction as (a: "Gb" | "V" | "Vb") => void}
        />

        {render()}

        {action !== "" && (
          <div>
            <button
              type="button"
              className="border rounded-xl px-3 py-1.5 text-xs hover:shadow-sm"
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
