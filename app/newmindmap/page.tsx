import { fetchAllTags } from "@/features/mydrive/lib/fetchMyDrive";
import MindmapEditor from "@/features/mindmap/components/MindmapEditor";

export default async function NewMindmapPage() {
  // 1. On récupère les tags pour que le TagSelector fonctionne
  const allTags = await fetchAllTags();

  // 2. On prépare un objet de données "vide" pour une nouvelle Mindmap
  const defaultData = {
    id: "", // ID vide signifie "Nouveau projet"
    title: "Nouvelle Mindmap",
    content: JSON.stringify({ nodes: [], edges: [] }),
    observation: "",
    tags: []
  };

  return (
    <main className="h-dvh w-full bg-neutral-950 text-white overflow-hidden flex flex-col">
      {/* On passe maintenant les props obligatoires */}
      <MindmapEditor allTags={allTags} initialData={defaultData} />
    </main>
  );
}