"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createDocRow } from "@/lib/createDocRow";
import { createTagAction, addTagToItemAction } from "@/features/mydrive/modify";
import type { Tag } from "@/features/mydrive/types";
import { supabase } from "@/lib/supabaseClient";

export default function NewDocPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"editing" | "saving" | "success" | "error">("editing");
  const [error, setError] = useState<string | null>(null);

  // Tags
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");

  // Charger tous les tags au montage
  useEffect(() => {
    async function loadTags() {
      const { data } = await supabase
        .from("tags")
        .select("id, name, created_at")
        .order("name", { ascending: true });
      if (data) setAllTags(data);
    }
    loadTags();
  }, []);

  const selectedTagIds = new Set(selectedTags.map((t) => t.id));

  const handleToggleTag = (tag: Tag) => {
    if (selectedTagIds.has(tag.id)) {
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    } else {
      setSelectedTags((prev) =>
        [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim().toLowerCase();
    if (!trimmed) return;

    try {
      const tag = await createTagAction(trimmed);
      setAllTags((prev) => {
        if (prev.some((t) => t.id === tag.id)) return prev;
        return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedTags((prev) =>
        [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewTagName("");
    } catch {
      console.error("Erreur création tag");
    }
  };

  async function handleSave() {
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    try {
      const docId = await createDocRow({
        title: title.trim(),
        content: content,
      });
      // Assigner les tags sélectionnés
      for (const tag of selectedTags) {
        await addTagToItemAction(docId, tag.id);
      }

      setStatus("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue.";
      setError(message);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Créer un document</h1>
          <Link
            href="/mydrive"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Retour MyDrive
          </Link>
        </header>

        {status === "editing" && (
          <div className="space-y-6">
            {/* Titre */}
            <div className="space-y-2">
              <label className="block text-sm text-neutral-400 uppercase tracking-wide">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du document..."
                className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-lg"
              />
            </div>

            {/* Contenu */}
            <div className="space-y-2">
              <label className="block text-sm text-neutral-400 uppercase tracking-wide">
                Contenu
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez votre document ici..."
                rows={14}
                className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors resize-y font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Tags */}
            <div className="space-y-3 border-t border-neutral-800 pt-6">
              <label className="block text-sm text-neutral-400 uppercase tracking-wide">
                Mots-clés
              </label>

              {/* Input nouveau tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  placeholder="Nouveau tag..."
                  className="flex-1 bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  +
                </button>
              </div>

              {/* Liste des tags */}
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isActive = selectedTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {allTags.length === 0 && (
                  <p className="text-neutral-500 text-sm italic">
                    Aucun tag. Créez-en un ci-dessus.
                  </p>
                )}
              </div>
            </div>

            {/* Bouton Enregistrer */}
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="w-full rounded-2xl px-6 py-4 text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Enregistrer le document
            </button>
          </div>
        )}

        {status === "saving" && (
          <div className="text-center py-12">
            <p className="text-sm opacity-80">Enregistrement en cours...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-lg font-semibold">Document créé</h2>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setTitle("");
                  setContent("");
                  setSelectedTags([]);
                  setStatus("editing");
                }}
                className="rounded-2xl px-6 py-3 font-semibold border"
              >
                Créer un autre
              </button>
              <Link
                href="/mydrive"
                className="rounded-2xl px-6 py-3 font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Voir MyDrive
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-lg font-semibold text-red-400">Erreur</h2>
            <p className="text-sm opacity-80">{error}</p>
            <button
              onClick={() => setStatus("editing")}
              className="rounded-2xl px-6 py-3 font-semibold border"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
