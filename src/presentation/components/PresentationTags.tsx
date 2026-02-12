"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Tag } from "@/features/mydrive/types";
import { createTagAction } from "@/features/mydrive/modify";

type Props = { selectedTags: Tag[]; setSelectedTags: (tags: Tag[]) => void; };

export default function PresentationTags({ selectedTags, setSelectedTags }: Props) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    supabase.from("tags").select("*").order("name").then(({ data }) => data && setAllTags(data));
  }, []);

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTagAction(newTagName.trim());
      setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTags([...selectedTags, tag]);
      setNewTagName("");
    } catch (e) { console.error(e); }
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
          className="bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm outline-none border border-neutral-700 focus:border-orange-500"
        />
        <button onClick={createTag} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-500">+</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTags(selectedTags.some(t => t.id === tag.id) ? selectedTags.filter(t => t.id !== tag.id) : [...selectedTags, tag])}
            className={`px-3 py-1 rounded-full text-sm ${selectedTags.some(t => t.id === tag.id) ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}