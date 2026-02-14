import Link from "next/link";
import { Play } from "lucide-react";
import type { Slide } from "../types";
import ExportMenu from "./ExportMenu";

type Props = {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  onSave: () => void;
  status: "idle" | "saving";
  slides: Slide[];
  presentationTitle: string;
  onBroadcast: () => void;
};

export default function PresentationHeader({
  title, setTitle, description, setDescription, onSave, status, slides, presentationTitle, onBroadcast,
}: Props) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la presentation..."
            className="w-full bg-transparent text-xl font-bold text-white placeholder-neutral-600 outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            className="w-full bg-transparent text-sm text-neutral-400 placeholder-neutral-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBroadcast}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            <Play size={14} />
            Diffuser
          </button>
          <ExportMenu slides={slides} title={presentationTitle} />
          <Link href="/mydrive" className="text-sm font-medium text-neutral-400 hover:text-white">
            Annuler
          </Link>
          <button
            onClick={onSave}
            disabled={!title.trim() || status === "saving"}
            className="rounded-xl bg-neutral-700 px-5 py-1.5 text-sm font-semibold text-white hover:bg-neutral-600 disabled:opacity-50"
          >
            {status === "saving" ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </header>
  );
}
