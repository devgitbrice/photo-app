import { supabase } from "@/lib/supabaseClient";
import type { MyDriveItem, Tag } from "@/features/mydrive/types";

/**
 * Récupère tous les documents MyDrive avec leurs tags
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
      content,
      doc_type,
      created_at,
      mydrive_tags (
        tags (
          id,
          name,
          created_at
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyDrive error:", error);
    throw new Error("Impossible de charger MyDrive.");
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    observation: (row.observation as string) || "",
    image_path: (row.image_path as string) || "",
    image_url: (row.image_url as string) || "",
    content: (row.content as string) || "",
    doc_type: (row.doc_type as "scan" | "doc") || "scan",
    created_at: row.created_at as string,
    tags: ((row.mydrive_tags as Array<{ tags: Tag }>) || [])
      .map((mt) => mt.tags)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

/**
 * Récupère tous les tags existants, triés par nom
 */
export async function fetchAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchAllTags error:", error);
    throw new Error("Impossible de charger les tags.");
  }

  return data ?? [];
}
