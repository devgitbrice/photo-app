"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

// On définit les types autorisés
type DocType = "doc" | "mindmap" | "table" | "presentation";

type CreateDocInput = {
  title: string;
  content: string;
  doc_type: DocType;
};

export async function createDocRow(input: CreateDocInput): Promise<string> {
  const { data, error } = await supabase
    .from("MyDrive")
    .insert({
      title: input.title,
      content: input.content,
      observation: "",
      image_path: "",
      image_url: "",
      doc_type: input.doc_type, // Type dynamique
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`DB insert failed: ${error.message}`);
  }

  revalidatePath("/mydrive");
  return data.id;
}