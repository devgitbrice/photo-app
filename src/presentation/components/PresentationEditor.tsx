"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocRow } from "@/lib/createDocRow";
import { addTagToItemAction } from "@/features/mydrive/modify";
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

export default function PresentationEditor() {
  const router = useRouter();
  const [docTitle, setDocTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Liste des slides (une par défaut)
  const [slides, setSlides] = useState<Slide[]>([
    { id: "1", title: "Nouvelle Slide", bullets: ["Premier point"] }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  const handleSave = async () => {
    if (!docTitle.trim()) return alert("Le titre est requis");
    setStatus("saving");
    try {
      const docId = await createDocRow({
        title: docTitle.trim(),
        content: JSON.stringify(slides),
        doc_type: "presentation",
        // @ts-expect-error : observation supportée par createDocRow
        observation: description,
      });
      for (const tag of selectedTags) await addTagToItemAction(docId, tag.id);
      router.push("/mydrive");
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