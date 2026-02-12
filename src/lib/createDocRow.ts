"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

type CreateDocInput = {
  title: string;
  content: string;
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
      doc_type: "doc",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`DB insert failed: ${error.message}`);
  }

  revalidatePath("/app/mydrive");
  return data.id;
}
