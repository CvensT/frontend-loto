"use client";

type LId = "1" | "2" | "3";
type Act = "Gb" | "V" | "Vb";

type Props = {
  loterieId: LId;
  onChangeLoterie: (id: LId) => void;
  action: Act | "";
  onChangeAction: (action: Act) => void;
};

export default function MenuPrincipal({
  loterieId,
  onChangeLoterie,
  action,
  onChangeAction,
}: Props) {
  return (
    <div className="border rounded-lg p-2 space-y-2 text-xs w-fit text-left">
      <div className="font-semibold">🎯 Menu principal</div>

      <div className="flex items-center gap-2">
        <label htmlFor="loterie" className="whitespace-nowrap">
          Loterie
        </label>
        <select
          id="loterie"
          value={loterieId}
          onChange={(e) => onChangeLoterie(e.target.value as LId)}
          className="border rounded px-2 py-1 text-xs"
        >
          <option value="1">Grande Vie</option>
          <option value="2">Lotto Max</option>
          <option value="3">Lotto 6/49</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-pressed={action === "Gb"}
          onClick={() => onChangeAction("Gb")}
          className={`px-2 py-1 rounded border text-xs w-fit ${
            action === "Gb" ? "bg-gray-100" : ""
          }`}
        >
          (Gb) Génération par blocs
        </button>
        <button
          type="button"
          aria-pressed={action === "V"}
          onClick={() => onChangeAction("V")}
          className={`px-2 py-1 rounded border text-xs w-fit ${
            action === "V" ? "bg-gray-100" : ""
          }`}
        >
          (V) Vérifier si combinaisons déjà tirées
        </button>
        <button
          type="button"
          aria-pressed={action === "Vb"}
          onClick={() => onChangeAction("Vb")}
          className={`px-2 py-1 rounded border text-xs w-fit ${
            action === "Vb" ? "bg-gray-100" : ""
          }`}
        >
          (Vb) Vérifier bloc
        </button>
      </div>

      <div className="text-[11px] text-gray-600">
        Option sélectionnée : <strong>{action === "" ? "Accueil" : action}</strong>
      </div>
    </div>
  );
}
