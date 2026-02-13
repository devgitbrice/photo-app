import PythonEditor from "@/features/python/components/PythonEditor";
import { fetchAllTags } from "@/features/mydrive/lib/fetchMyDrive"; // Nom corrigé ici

export default async function NewPythonPage() {
  // On appelle la bonne fonction : fetchAllTags
  const allTags = await fetchAllTags(); 

  return (
    <main className="h-dvh w-full overflow-hidden bg-black">
      <PythonEditor allTags={allTags} />
    </main>
  );
}