"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocRow } from "@/lib/createDocRow";
import { addTagToItemAction } from "@/features/mydrive/modify";
import TableHeader from "./TableHeader";
import TableGrid from "./TableGrid";
import TableTags from "./TableTags";
import type { Tag } from "@/features/mydrive/types";

export default function TableEditor() {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Handsontable préfère un tableau de tableaux ou d'objets simples
  // On initialise avec 20 lignes et 10 colonnes pour avoir un vrai feeling Excel dès le départ
  const [data, setData] = useState<any[]>(
    Array.from({ length: 20 }, () => Array(10).fill(""))
  );
  
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  const handleSave = async () => {
    if (!title.trim()) return alert("Le titre est obligatoire");
    setStatus("saving");

    try {
      // Sauvegarde du contenu JSON dans la colonne content
      const docId = await createDocRow({
        title: title.trim(),
        content: JSON.stringify(data),
        doc_type: "table",
        // @ts-ignore : ajout de la description si ta table MyDrive possède la colonne observation
        observation: description,
      });

      // Gestion des tags
      for (const tag of selectedTags) {
        await addTagToItemAction(docId, tag.id);
      }

      router.push("/mydrive");
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      setStatus("idle");
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full bg-neutral-900 text-white overflow-hidden">
      {/* Barre d'outils et Titre */}
      <TableHeader 
        title={title} setTitle={setTitle} 
        description={description} setDescription={setDescription}
        onSave={handleSave} status={status} 
      />
      
      {/* Zone de la grille Excel - Fond Noir, remplit tout l'espace restant */}
      <div className="flex-1 relative bg-black min-h-0">
        <TableGrid data={data} setData={setData} />
      </div>

      {/* Barre de Tags en bas */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-4">
        <TableTags selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
      </div>
    </div>
  );
}