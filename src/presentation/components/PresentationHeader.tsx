import Link from "next/link";

type Props = {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  onSave: () => void;
  status: "idle" | "saving";
};

export default function PresentationHeader({ title, setTitle, description, setDescription, onSave, status }: Props) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la présentation..."
            className="w-full bg-transparent text-2xl font-bold text-white placeholder-neutral-600 outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            className="w-full bg-transparent text-sm text-neutral-400 placeholder-neutral-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/mydrive" className="text-sm font-medium text-neutral-400 hover:text-white">
            Annuler
          </Link>
          <button
            onClick={onSave}
            disabled={!title.trim() || status === "saving"}
            className="rounded-xl bg-orange-600 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {status === "saving" ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </header>
  );
}