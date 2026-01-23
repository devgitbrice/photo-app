"use server";

// 👇 LA CORRECTION EST ICI : On importe ta connexion existante
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