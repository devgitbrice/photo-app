import { supabase } from "@/lib/supabaseClient";

type CreateRowInput = {
  title: string;
  observation: string;
  imagePath: string;
  imageUrl: string;
};

export async function createMyDriveRow(input: CreateRowInput) {
  const { error } = await supabase.from("MyDrive").insert({
    title: input.title,
    observation: input.observation,
    image_path: input.imagePath,
    image_url: input.imageUrl,
  });

  if (error) {
    throw new Error(`DB insert failed: ${error.message}`);
  }
}
