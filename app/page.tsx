"use client";

import { useState } from "react";
import MenuPrincipal from "../components/MenuPrincipal";
import GenerateurGb from "../components/GenerateurGb";
import VerificationCombinaison from "../components/VerificationCombinaison";
import VerificationBlocs from "../components/VerificationBlocs";

type Selection = { loterieId: string; action: "Gb" | "V" | "Vb" };

export default function Page() {
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <MenuPrincipal onChange={setSelection} defaultLoterieId="2" />

      {!selection && <div>Sélectionne une action dans le menu.</div>}

      {selection?.action === "Gb" && <GenerateurGb loterieId={selection.loterieId} />}
      {selection?.action === "V"  && <VerificationCombinaison loterieId={selection.loterieId} />}
      {selection?.action === "Vb" && <VerificationBlocs loterieId={selection.loterieId} />}
    </main>
  );
}

