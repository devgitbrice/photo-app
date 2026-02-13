"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const isEditMode = !!initialData?.id;
  const [docTitle, setDocTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.observation || "");

  const [slides, setSlides] = useState<Slide[]>(
    initialData?.content ? parseSlides(initialData.content) : defaultSlides
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- AUTO-SAVE (edit mode only, debounce 1.5s) ---
  const autoSave = useCallback(async () => {
    if (!isEditMode || !docTitle.trim()) return;
    setStatus("saving");
    try {
      await updateDriveItemAction(initialData!.id, {
        title: docTitle.trim(),
        content: JSON.stringify(slides),
        observation: description,
      });
    } catch (e) {
      console.error("Auto-save error:", e);
    } finally {
      setStatus("idle");
    }
  }, [isEditMode, initialData, docTitle, slides, description]);

  const scheduleAutoSave = useCallback(() => {
    if (!isEditMode) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(), 1500);
  }, [isEditMode, autoSave]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  // Watch for changes to trigger auto-save in edit mode
  useEffect(() => {
    if (isEditMode) scheduleAutoSave();
  }, [slides, docTitle, description, isEditMode, scheduleAutoSave]);

  const handleSave = async () => {
    if (!docTitle.trim()) return alert("Le titre est requis");
    setStatus("saving");
    try {
      if (isEditMode) {
        await updateDriveItemAction(initialData!.id, {
          title: docTitle.trim(),
          content: JSON.stringify(slides),
          observation: description,
        });
        setStatus("idle");
      } else {
        const docId = await createDocRow({
          title: docTitle.trim(),
          content: JSON.stringify(slides),
          doc_type: "presentation",
          // @ts-expect-error : observation supportée par createDocRow
          observation: description,
        });
        for (const tag of selectedTags) await addTagToItemAction(docId, tag.id);
        router.push("/mydrive");
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
