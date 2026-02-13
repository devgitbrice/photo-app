import { supabase } from "@/lib/supabaseClient";
import { fetchAllTags } from "@/features/mydrive/lib/fetchMyDrive";
import PythonEditor from "@/features/python/components/PythonEditor";
import { notFound } from "next/navigation";

// --- ATTENTION : params est maintenant une Promise ---
export default async function EditPythonPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. On attend que les paramètres de l'URL soient résolus
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 2. On récupère le script et les tags en parallèle
  const [ { data: script, error }, allTags ] = await Promise.all([
    supabase
      .from("MyDrive")
      .select("*, tags:mydrive_tags(tag_id)")
      .eq("id", id)
      .single(),
    fetchAllTags()
  ]);

  // Si erreur ou pas de script
  if (error || !script) {
    return notFound();
  }

  // 3. On formate les tags pour l'éditeur
  const initialTags = allTags.filter(t => 
    script.tags?.some((st: any) => st.tag_id === t.id)
  );

  return (
    <main className="h-dvh w-full overflow-hidden bg-black text-white">
      <PythonEditor 
        allTags={allTags} 
        initialData={{
          id: script.id,
          title: script.title,
          code: script.content || "",
          description: script.observation || "",
          tags: initialTags
        }} 
      />
    </main>
  );
}