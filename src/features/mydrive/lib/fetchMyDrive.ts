import { supabase } from "@/lib/supabaseClient";
import type { MyDriveItem } from "@/features/mydrive/types";

/**
 * Récupère tous les documents MyDrive
 * Triés par date de création (plus récent en premier)
 */
export async function fetchMyDrive(): Promise<MyDriveItem[]> {
  const { data, error } = await supabase
    .from("MyDrive")
    .select(
      `
      id,
      title,
      observation,
      image_path,
      image_url,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyDrive error:", error);
    throw new Error("Impossible de charger MyDrive.");
  }

  return data ?? [];
}
