"use client";

type Props = {
  loterieId: "1" | "2" | "3";
  onChangeLoterie: (id: "1" | "2" | "3") => void;
  action: "Gb" | "V" | "Vb";
  onChangeAction: (action: "Gb" | "V" | "Vb") => void;
};

export default function MenuPrincipal({ loterieId, onChangeLoterie, action, onChangeAction }: Props) {
  return (
    <div className="border p-4 rounded space-y-4">
      <h2 className="text-xl font-bold">🎯 Menu principal</h2>

      <div className="flex items-center gap-2">
        <label htmlFor="loterie">Loterie</label>
        <select
          id="loterie"
          value={loterieId}
          onChange={(e) => onChangeLoterie(e.target.value as "1" | "2" | "3")}
          className="border rounded px-2 py-1"
        >
          <option value="1">Grande Vie</option>
          <option value="2">Lotto Max</option>
          <option value="3">Lotto 6/49</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onChangeAction("Gb")}
          className={`px-4 py-2 rounded border ${action === "Gb" ? "bg-gray-200" : ""}`}
        >
          (Gb) Génération par blocs couvrants (+ étoile)
        </button>
        <button
          onClick={() => onChangeAction("V")}
          className={`px-4 py-2 rounded border ${action === "V" ? "bg-gray-200" : ""}`}
        >
          (V) Vérifier si combinaison existe
        </button>
        <button
          onClick={() => onChangeAction("Vb")}
          className={`px-4 py-2 rounded border ${action === "Vb" ? "bg-gray-200" : ""}`}
        >
          (Vb) Vérifier couverture de blocs (format forcé base+étoile)
        </button>
      </div>

      <div className="text-sm text-gray-600">
        👉 Que voulez-vous faire ? [ <strong>{action}</strong> ]
      </div>
    </div>
  );
}
