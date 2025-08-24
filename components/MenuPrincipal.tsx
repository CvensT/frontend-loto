type LoterieId = "1" | "2" | "3";
type Action = "Gb" | "V" | "Vb";

type Props = {
  loterieId: LoterieId;
  onChangeLoterie: (id: LoterieId) => void;
  onAction: (a: Action) => void;
};

export default function MenuPrincipal({ loterieId, onChangeLoterie, onAction }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-3 text-sm max-w-md w-full text-center mb-4">
      <div className="font-semibold text-base">🎯 Menu principal</div>

      {/* Sélecteur loterie contrôlé */}
      <div className="flex items-center justify-center gap-2">
        <label className="text-xs">Loterie</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={loterieId}
          onChange={(e) => onChangeLoterie(e.target.value as LoterieId)}
        >
          <option value="1">Grande Vie</option>
          <option value="2">Lotto Max</option>
          <option value="3">Lotto 6/49</option>
        </select>
      </div>

      {/* Actions compactes : utilisent toujours la loterie courante */}
      <div className="flex flex-col gap-2">
        <button
          className="border rounded px-2 py-1 text-xs"
          onClick={() => onAction("Gb")}
        >
          (Gb) Génération par blocs
        </button>
        <button
          className="border rounded px-2 py-1 text-xs"
          onClick={() => onAction("Vb")}
        >
          (Vb) Vérifier conformité de blocs
        </button>
        <button
          className="border rounded px-2 py-1 text-xs"
          onClick={() => onAction("V")}
        >
          (V) Vérifier si combinaisons déjà tirées
        </button>
      </div>

      {/* Indication courte */}
      <div className="text-[11px] text-gray-600">
        Choisis d’abord la loterie. Les options (Gb, Vb, V) utilisent automatiquement cette loterie.
        Changer de loterie te ramène à l’accueil.
      </div>
    </div>
  );
}
