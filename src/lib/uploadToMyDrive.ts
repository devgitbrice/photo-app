import { supabase } from "@/lib/supabaseClient";

type UploadResult = {
  imagePath: string;
  publicUrl: string;
};

function getSafeExtension(file: File) {
  // fallback simple: type -> extension
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return byMime[file.type] ?? "jpg";
}

export async function uploadToMyDrive(file: File): Promise<UploadResult> {
  const bucket = "MyDrive";

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const ext = getSafeExtension(file);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const imagePath = `${yyyy}/${mm}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(imagePath, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Upload Storage failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(imagePath);

  if (!data?.publicUrl) {
    throw new Error("Could not generate public URL for uploaded image.");
  }

  return { imagePath, publicUrl: data.publicUrl };
}
