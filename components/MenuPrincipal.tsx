"use client";

type Action = "Gb" | "V" | "Vb";

const LOTERIES = [
  { id: "1", nom: "Grande Vie" },
  { id: "2", nom: "Lotto Max" },
  { id: "3", nom: "Lotto 6/49" },
];

export default function MenuPrincipal({
  loterieId,
  onChangeLoterie,
  action,
  onChangeAction,
}: {
  loterieId: "1" | "2" | "3";
  onChangeLoterie: (v: "1" | "2" | "3") => void;
  action: Action;
  onChangeAction: (a: Action) => void;
}) {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border p-4 space-y-3">
      <div className="text-xl font-semibold">🎯 Menu principal</div>

      {/* 👇 Sélecteur unique de loterie (plus rien en haut de page) */}
      <label className="flex items-center gap-2">
        <span className="w-24 text-sm text-gray-700">Loterie</span>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={loterieId}
          onChange={(e) => onChangeLoterie(e.target.value as "1" | "2" | "3")}
        >
          {LOTERIES.map((l) => (
            <option key={l.id} value={l.id}>{l.nom}</option>
          ))}
        </select>
      </label>

      <p className="text-sm text-gray-600">
        (Gb) Génération par blocs • (V) Vérifier si combinaison existe • (Vb) Vérifier couverture de blocs
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onChangeAction("Gb")}
          className={`rounded-full px-4 py-2 border ${action === "Gb" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
        >
          Gb
        </button>
        <button
          onClick={() => onChangeAction("V")}
          className={`rounded-full px-4 py-2 border ${action === "V" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
        >
          V
        </button>
        <button
          onClick={() => onChangeAction("Vb")}
          className={`rounded-full px-4 py-2 border ${action === "Vb" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
        >
          Vb
        </button>
      </div>

      <div className="text-sm text-gray-700">
        👉 Action active : <b>{action}</b>
      </div>
    </section>
  );
}
