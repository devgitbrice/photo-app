"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createDocRow } from "@/lib/createDocRow";
import { addTagToItemAction, updateDriveItemAction } from "@/features/mydrive/modify";
import PresentationHeader from "./PresentationHeader";
import PresentationSidebar from "./PresentationSidebar";
import PresentationToolbar from "./PresentationToolbar";
import SlideCanvas from "./SlideCanvas";
import PresentationTags from "./PresentationTags";
import BroadcastMode from "./BroadcastMode";
import type { Tag } from "@/features/mydrive/types";
import type { Slide } from "../types";
import { parseSlides, createDefaultSlide } from "../types";

interface PresentationEditorProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    observation: string;
    tags: Tag[];
  };
}

export default function PresentationEditor({ initialData }: PresentationEditorProps) {
  const [docId, setDocId] = useState(initialData?.id || "");
  const [docTitle, setDocTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.observation || "");

  const [slides, setSlides] = useState<Slide[]>(
    initialData?.content ? parseSlides(initialData.content) : [createDefaultSlide()]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const [broadcasting, setBroadcasting] = useState(false);
  const [nightMode, setNightMode] = useState(false);

  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  // Clear selection when changing slides
  useEffect(() => {
    setSelectedElementId(null);
    setEditingElementId(null);
  }, [currentIndex]);

  // ─── Auto-save (debounce 1.5s) ─────────────────────────────
  const autoSave = useCallback(async () => {
    if (!docTitle.trim() || savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    try {
      const content = JSON.stringify(slides);
      if (docId) {
        await updateDriveItemAction(docId, { title: docTitle.trim(), content, observation: description });
      } else {
        const newId = await createDocRow({
          title: docTitle.trim(), content, doc_type: "presentation", observation: description,
        });
        setDocId(newId);
        for (const tag of selectedTags) await addTagToItemAction(newId, tag.id);
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

  useEffect(() => {
    if (docTitle.trim()) scheduleAutoSave();
  }, [slides, docTitle, description, scheduleAutoSave]);

  const handleSave = async () => {
    if (!docTitle.trim()) return alert("Le titre est requis");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setStatus("saving");
    try {
      const content = JSON.stringify(slides);
      if (docId) {
        await updateDriveItemAction(docId, { title: docTitle.trim(), content, observation: description });
      } else {
        const newId = await createDocRow({
          title: docTitle.trim(), content, doc_type: "presentation", observation: description,
        });
        setDocId(newId);
        for (const tag of selectedTags) await addTagToItemAction(newId, tag.id);
        window.history.replaceState(null, "", `/editpresentation/${newId}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatus("idle");
    }
  };

  const currentSlide = slides[currentIndex];
  const updateCurrentSlide = (s: Slide) => {
    const newSlides = [...slides];
    newSlides[currentIndex] = s;
    setSlides(newSlides);
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white">
      {broadcasting && (
        <BroadcastMode
          slides={slides}
          initialIndex={currentIndex}
          onClose={() => setBroadcasting(false)}
          onSlidesChange={setSlides}
          nightMode={nightMode}
        />
      )}

      <PresentationHeader
        title={docTitle} setTitle={setDocTitle}
        description={description} setDescription={setDescription}
        onSave={handleSave} status={status}
        slides={slides}
        presentationTitle={docTitle}
        onBroadcast={() => setBroadcasting(true)}
        nightMode={nightMode}
        setNightMode={setNightMode}
      />

      <PresentationToolbar
        slide={currentSlide}
        updateSlide={updateCurrentSlide}
        selectedId={selectedElementId}
        setSelectedId={setSelectedElementId}
      />

      <div className="flex-1 flex overflow-hidden">
        <PresentationSidebar
          slides={slides} setSlides={setSlides}
          currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
          nightMode={nightMode}
        />
        <SlideCanvas
          slide={currentSlide}
          updateSlide={updateCurrentSlide}
          selectedId={selectedElementId}
          setSelectedId={setSelectedElementId}
          editingId={editingElementId}
          setEditingId={setEditingElementId}
          nightMode={nightMode}
        />
      </div>

      <div className="bg-neutral-900 border-t border-neutral-800 p-4">
        <PresentationTags selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
      </div>
    </div>
  );
}
