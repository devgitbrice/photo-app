"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export async function updateDriveItemAction(id: string, updates: { title?: string; observation?: string }) {
  
  // Note : On n'a plus besoin de faire "const supabase = createClient()" 
  // car on utilise l'instance 'supabase' importée ligne 4.

  const { error } = await supabase
    .from("MyDrive") 
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Erreur update Supabase:", error);
    throw new Error("Erreur lors de la mise à jour");
  }

  // On rafraîchit la page pour voir les changements
  revalidatePath("/app/mydrive");
}

export async function deleteDriveItemAction(id: string, imagePath: string) {
  // Supprimer le fichier du storage
  const { error: storageError } = await supabase.storage
    .from("MyDrive")
    .remove([imagePath]);

  if (storageError) {
    console.error("Erreur suppression storage:", storageError);
    throw new Error("Erreur lors de la suppression du fichier");
  }

  // Supprimer l'entrée de la base de données
  const { error: dbError } = await supabase
    .from("MyDrive")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("Erreur suppression DB:", dbError);
    throw new Error("Erreur lors de la suppression de l'entrée");
  }

  revalidatePath("/app/mydrive");
}