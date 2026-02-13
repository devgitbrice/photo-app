"use client";

import { useState } from "react";
import Link from "next/link";
import { updateDriveItemAction } from "@/features/mydrive/modify";
import type { Tag } from "@/features/mydrive/types";

interface DocEditorProps {
  allTags: Tag[];
  initialData: {
    id: string;
    title: string;
    content: string;
    observation: string;
    tags: Tag[];
  };
}

export default function DocEditor({ allTags, initialData }: DocEditorProps) {
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [observation, setObservation] = useState(initialData.observation);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = async () => {
    if (!title.trim()) return;
    setStatus("saving");
    try {
      await updateDriveItemAction(initialData.id, {
        title: title.trim(),
        content,
        observation,
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      setStatus("idle");
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <Link
          href="/mydrive"
          className="text-sm text-neutral-400 hover:text-white transition-colors p-2 bg-neutral-800 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <button
          onClick={handleSave}
          disabled={!title.trim() || status === "saving"}
          className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {status === "saving"
            ? "Sauvegarde..."
            : status === "saved"
            ? "Enregistré !"
            : "Enregistrer"}
        </button>
      </header>

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du document..."
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-neutral-600 outline-none border-b border-neutral-800 pb-2 focus:border-blue-500 transition-colors"
        />

        <input
          type="text"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Description / observation..."
          className="w-full bg-transparent text-sm text-neutral-400 placeholder-neutral-700 outline-none border-b border-neutral-800 pb-2 focus:border-blue-500 transition-colors"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu du document..."
          rows={20}
          className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors resize-y font-mono text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
