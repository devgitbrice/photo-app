"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createDocRow } from "@/lib/createDocRow";
import { addTagToItemAction, updateDriveItemAction } from "@/features/mydrive/modify";
import PresentationHeader from "./PresentationHeader";
import PresentationSidebar from "./PresentationSidebar";
import PresentationSlide from "./PresentationSlide";
import PresentationTags from "./PresentationTags";
import type { Tag } from "@/features/mydrive/types";

export type Slide = {
  id: string;
  title: string;
  bullets: string[];
};

interface PresentationEditorProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    observation: string;
    tags: Tag[];
  };
}

const defaultSlides: Slide[] = [
  { id: "1", title: "Nouvelle Slide", bullets: ["Premier point"] }
];

function parseSlides(content: string): Slide[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return defaultSlides;
}

export default function PresentationEditor({ initialData }: PresentationEditorProps) {
  const [docId, setDocId] = useState(initialData?.id || "");
  const [docTitle, setDocTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.observation || "");

  const [slides, setSlides] = useState<Slide[]>(
    initialData?.content ? parseSlides(initialData.content) : defaultSlides
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false);

  // --- AUTO-SAVE (debounce 1.5s) ---
  const autoSave = useCallback(async () => {
    if (!docTitle.trim() || savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    try {
      if (docId) {
        // Edit mode: update existing document
        await updateDriveItemAction(docId, {
          title: docTitle.trim(),
          content: JSON.stringify(slides),
          observation: description,
        });
      } else {
        // Create mode: create document, then switch to edit mode
        const newId = await createDocRow({
          title: docTitle.trim(),
          content: JSON.stringify(slides),
          doc_type: "presentation",
          observation: description,
        });
        setDocId(newId);
        for (const tag of selectedTags) await addTagToItemAction(newId, tag.id);
        // Update URL without full reload so refresh will restore state
        window.history.replaceState(null, "", `/editpresentation/${newId}`);
      }
    } catch (e) {
      console.error("Auto-save error:", e);
    } finally {
      savingRef.current = false;
      setStatus("idle");
    }
  }, [docId, docTitle, slides, description, selectedTags]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(), 1500);
  }, [autoSave]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  // Watch for changes to trigger auto-save
  useEffect(() => {
    if (docTitle.trim()) scheduleAutoSave();
  }, [slides, docTitle, description, scheduleAutoSave]);

  const handleSave = async () => {
    if (!docTitle.trim()) return alert("Le titre est requis");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setStatus("saving");
    try {
      if (docId) {
        await updateDriveItemAction(docId, {
          title: docTitle.trim(),
          content: JSON.stringify(slides),
          observation: description,
        });
        setStatus("idle");
      } else {
        const newId = await createDocRow({
          title: docTitle.trim(),
          content: JSON.stringify(slides),
          doc_type: "presentation",
          observation: description,
        });
        setDocId(newId);
        for (const tag of selectedTags) await addTagToItemAction(newId, tag.id);
        window.history.replaceState(null, "", `/editpresentation/${newId}`);
        setStatus("idle");
      }
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white">
      <PresentationHeader
        title={docTitle} setTitle={setDocTitle}
        description={description} setDescription={setDescription}
        onSave={handleSave} status={status}
      />

      <div className="flex-1 flex overflow-hidden">
        <PresentationSidebar
          slides={slides} setSlides={setSlides}
          currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
        />
        <PresentationSlide
          slide={slides[currentIndex]}
          updateSlide={(s) => {
            const newSlides = [...slides];
            newSlides[currentIndex] = s;
            setSlides(newSlides);
          }}
        />
      </div>

      <div className="bg-neutral-900 border-t border-neutral-800 p-4">
        <PresentationTags selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
      </div>
    </div>
  );
}
