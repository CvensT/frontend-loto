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
  const Btn = ({
    act,
    label,
  }: {
    act: Act;
    label: string;
  }) => (
    <button
      type="button"
      aria-pressed={action === act}
      onClick={() => onChangeAction(act)}
      className={`px-3 py-2 rounded-xl border text-sm w-full sm:w-auto text-left
        ${action === act ? "bg-gray-100" : "bg-white"} hover:shadow-sm`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-2xl border bg-white/70 p-4 sm:p-5 shadow-sm">
      <div className="text-base font-semibold mb-3">🎯 Menu principal</div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label htmlFor="loterie" className="text-sm">
          Loterie
        </label>
        <select
          id="loterie"
          value={loterieId}
          onChange={(e) => onChangeLoterie(e.target.value as LId)}
          className="border rounded-lg px-2 py-1.5 text-sm bg-white"
        >
          <option value="1">Grande Vie</option>
          <option value="2">Lotto Max</option>
          <option value="3">Lotto 6/49</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Btn act="Gb" label="(Gb) Génération par blocs (+ étoile)" />
        <Btn act="V"  label="(V) Vérifier si combinaison existe" />
        <Btn act="Vb" label="(Vb) Vérifier couverture de blocs" />
      </div>

      <div className="mt-3 text-xs text-gray-600">
        Option sélectionnée :{" "}
        <strong>{action === "" ? "Accueil" : action}</strong>
      </div>
    </section>
  );
}
