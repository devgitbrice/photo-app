"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { updateDriveItemAction } from "@/features/mydrive/modify";
import TagSelector from "@/features/mydrive/components/TagSelector";
import type { Tag } from "@/features/mydrive/types";
import DocHeader from "@/features/doc/components/DocHeader";
import DocRibbon from "@/features/doc/components/DocRibbon";
import BlockManager from "@/features/doc/components/BlockManager";

interface DocEditorProps {
  allTags: Tag[];
  initialData: {
    id: string; title: string; content: string; observation: string; tags: Tag[];
  };
}

export default function DocEditor({ allTags: initialAllTags, initialData }: DocEditorProps) {
  const [title, setTitle] = useState(initialData.title);
  const [observation, setObservation] = useState(initialData.observation);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData.tags);
  const [allTags, setAllTags] = useState<Tag[]>(initialAllTags);
  const [tocOpen, setTocOpen] = useState(true);

  const contentRef = useRef(initialData.content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(async (t: string, c: string, o: string) => {
    if (!t.trim()) return;
    setStatus("saving");
    try {
      await updateDriveItemAction(initialData.id, { title: t.trim(), content: c, observation: o });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("idle");
    }
  }, [initialData.id]);

  const scheduleAutoSave = useCallback((t: string, c: string, o: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(t, c, o), 1000);
  }, [autoSave]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleAutoSave(val, contentRef.current, observation);
  };

  const handleObservationChange = (val: string) => {
    setObservation(val);
    scheduleAutoSave(title, contentRef.current, val);
  };

  const handleContentChange = (html: string) => {
    contentRef.current = html;
    scheduleAutoSave(title, html, observation);
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-neutral-950">
      <DocHeader title={title} observation={observation} status={status} onTitleChange={handleTitleChange} onObservationChange={handleObservationChange} />
      <DocRibbon tocOpen={tocOpen} setTocOpen={setTocOpen} />
      
      {/* Le composant est posé directement, la div buggée a disparu ! */}
      <BlockManager initialHtml={initialData.content} tocOpen={tocOpen} onChange={handleContentChange} />

      <div className="bg-neutral-900 border-t border-neutral-800 p-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest shrink-0">Tags :</span>
          <div className="flex-1 overflow-x-auto">
            <TagSelector itemId={initialData.id} itemTags={selectedTags} allTags={allTags} onTagsChange={(_id, newTags) => setSelectedTags(newTags)} onNewTagCreated={(tag) => setAllTags((prev) => [...prev, tag])} />
          </div>
        </div>
      </div>
    </div>
  );
}