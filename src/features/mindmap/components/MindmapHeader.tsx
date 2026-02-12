import Link from "next/link";

type MindmapHeaderProps = {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  onSave: () => void;
  status: "idle" | "saving";
};

export default function MindmapHeader({
  title,
  setTitle,
  description,
  setDescription,
  onSave,
  status,
}: MindmapHeaderProps) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          {/* Titre */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la Mindmap..."
            className="w-full bg-transparent text-2xl font-bold text-white placeholder-neutral-600 outline-none focus:placeholder-neutral-700"
          />
          {/* Description */}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ajouter une description..."
            className="w-full bg-transparent text-sm text-neutral-400 placeholder-neutral-700 outline-none focus:text-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mydrive"
            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Annuler
          </Link>
          <button
            onClick={onSave}
            disabled={!title.trim() || status === "saving"}
            className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {status === "saving" ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </header>
  );
}