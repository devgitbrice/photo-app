"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Tag } from "@/features/mydrive/types";
import { createTagAction } from "@/features/mydrive/modify";

type MindmapTagsProps = {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
};

export default function MindmapTags({ selectedTags, setSelectedTags }: MindmapTagsProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    supabase.from("tags").select("*").order("name").then(({ data }) => {
      if (data) setAllTags(data);
    });
  }, []);

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    setSelectedTags(
      isSelected ? selectedTags.filter((t) => t.id !== tag.id) : [...selectedTags, tag]
    );
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTagAction(newTagName.trim());
      setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTags([...selectedTags, tag]);
      setNewTagName("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTag()}
          placeholder="Nouveau tag..."
          className="bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm outline-none border border-neutral-700 focus:border-purple-500"
        />
        <button onClick={createTag} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500">+</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedTags.some((t) => t.id === tag.id) ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}