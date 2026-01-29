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

export async function replaceImageAction(id: string, imagePath: string, imageData: string) {
  // imageData est un base64 data URL
  const base64Data = imageData.split(",")[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Supprimer l'ancien fichier
  const { error: deleteError } = await supabase.storage
    .from("MyDrive")
    .remove([imagePath]);

  if (deleteError) {
    console.error("Erreur suppression ancien fichier:", deleteError);
    throw new Error("Erreur lors de la suppression de l'ancien fichier");
  }

  // Upload le nouveau fichier avec le même chemin
  const { error: uploadError } = await supabase.storage
    .from("MyDrive")
    .upload(imagePath, bytes, {
      upsert: true,
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Erreur upload nouveau fichier:", uploadError);
    throw new Error("Erreur lors de l'upload du nouveau fichier");
  }

  // Récupérer la nouvelle URL publique (avec un cache buster)
  const { data } = supabase.storage.from("MyDrive").getPublicUrl(imagePath);
  const newUrl = data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;

  // Mettre à jour l'URL dans la base de données pour forcer le refresh du cache
  if (newUrl) {
    const { error: updateError } = await supabase
      .from("MyDrive")
      .update({ image_url: newUrl })
      .eq("id", id);

    if (updateError) {
      console.error("Erreur update URL:", updateError);
    }
  }

  revalidatePath("/app/mydrive");

  return { success: true, newUrl };
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