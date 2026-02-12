"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocRow } from "@/lib/createDocRow";
import { addTagToItemAction } from "@/features/mydrive/modify";
import MindmapHeader from "./MindmapHeader";
import MindmapCanvas from "./MindmapCanvas";
import MindmapTags from "./MindmapTags";
import type { Tag } from "@/features/mydrive/types";

export default function MindmapEditor() {
  const router = useRouter();
  
  // États Header
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // État Canvas (Données de la mindmap)
  const [mapData, setMapData] = useState<object>({ nodes: [], edges: [] });
  
  // États Footer (Tags)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  const handleSave = async () => {
    if (!title.trim()) return alert("Le titre est requis");
    setStatus("saving");

    try {
      // Note : On passera l'observation (description) à createDocRow
      // Il faudra mettre à jour createDocRow pour qu'il l'accepte
      const docId = await createDocRow({
        title: title.trim(),
        content: JSON.stringify(mapData),
        doc_type: "mindmap",
        // @ts-expect-error : Propriété à ajouter dans createDocRow à l'étape suivante
        observation: description,
      });

      for (const tag of selectedTags) {
        await addTagToItemAction(docId, tag.id);
      }

      router.push("/mydrive");
    } catch (e) {
      console.error(e);
      setStatus("idle");
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white">
      <MindmapHeader
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        onSave={handleSave}
        status={status}
      />
      
      <div className="flex-1 relative overflow-hidden bg-neutral-950">
        <MindmapCanvas data={mapData} setData={setMapData} />
      </div>

      <div className="bg-neutral-900 border-t border-neutral-800 p-4">
        <MindmapTags selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
      </div>
    </div>
  );
}