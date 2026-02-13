import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface DocHeaderProps {
  title: string;
  observation: string;
  status: "idle" | "saving" | "saved";
  onTitleChange: (val: string) => void;
  onObservationChange: (val: string) => void;
}

export default function DocHeader({
  title,
  observation,
  status,
  onTitleChange,
  onObservationChange,
}: DocHeaderProps) {
  return (
    <div className="flex flex-col shrink-0">
      <div className="bg-neutral-900 border-b border-neutral-800 p-3 flex items-center gap-3">
        <Link href="/mydrive" className="text-neutral-400 hover:text-white transition-colors p-2 bg-neutral-800 rounded-lg shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Titre du document..."
          className="flex-1 bg-transparent text-xl font-bold text-white placeholder-neutral-600 outline-none"
        />

        <span className={`text-xs px-2 py-1 rounded-full transition-all shrink-0 ${
          status === "saving" ? "bg-yellow-600/20 text-yellow-400" :
          status === "saved" ? "bg-green-600/20 text-green-400" :
          "bg-neutral-800 text-neutral-500"
        }`}>
          {status === "saving" ? "Sauvegarde..." : status === "saved" ? "Enregistré" : "Auto-save"}
        </span>
      </div>

      <div className="bg-neutral-900/50 border-b border-neutral-800 px-4 py-2">
        <input
          type="text"
          value={observation}
          onChange={(e) => onObservationChange(e.target.value)}
          placeholder="Description / observation..."
          className="w-full bg-transparent text-sm text-neutral-400 placeholder-neutral-700 outline-none"
        />
      </div>
    </div>
  );
}