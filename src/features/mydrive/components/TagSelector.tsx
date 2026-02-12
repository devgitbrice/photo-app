"use client";

import { useState } from "react";
import type { Tag } from "@/features/mydrive/types";
import {
  createTagAction,
  addTagToItemAction,
  removeTagFromItemAction,
} from "@/features/mydrive/modify";

type Props = {
  itemId: string;
  itemTags: Tag[];
  allTags: Tag[];
  onTagsChange: (itemId: string, newTags: Tag[]) => void;
  onNewTagCreated: (tag: Tag) => void;
};

export default function TagSelector({
  itemId,
  itemTags,
  allTags,
  onTagsChange,
  onNewTagCreated,
}: Props) {
  const [newTagName, setNewTagName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const activeTagIds = new Set(itemTags.map((t) => t.id));

  const handleToggleTag = async (tag: Tag) => {
    const isActive = activeTagIds.has(tag.id);

    // Mise à jour optimiste
    const newTags = isActive
      ? itemTags.filter((t) => t.id !== tag.id)
      : [...itemTags, tag].sort((a, b) => a.name.localeCompare(b.name));
    onTagsChange(itemId, newTags);

    try {
      if (isActive) {
        await removeTagFromItemAction(itemId, tag.id);
      } else {
        await addTagToItemAction(itemId, tag.id);
      }
    } catch (error) {
      console.error("Erreur toggle tag:", error);
      // Revert
      onTagsChange(itemId, itemTags);
    }
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim().toLowerCase();
    if (!trimmed) return;

    setIsAdding(true);
    try {
      const tag = await createTagAction(trimmed);
      onNewTagCreated(tag);
      // Aussi l'ajouter au document
      const newTags = [...itemTags, tag].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      onTagsChange(itemId, newTags);
      await addTagToItemAction(itemId, tag.id);
      setNewTagName("");
    } catch (error) {
      console.error("Erreur création tag:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Input pour créer un nouveau tag */}
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
          disabled={!newTagName.trim() || isAdding}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          +
        </button>
      </div>

      {/* Liste de tous les tags */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isActive = activeTagIds.has(tag.id);
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
  );
}
