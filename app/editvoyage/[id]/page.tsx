import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import TripEditor from "@/features/voyage/components/TripEditor";

export default async function EditVoyagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: item, error } = await supabase
    .from("MyDrive")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) return notFound();

  return (
    <main className="min-h-dvh w-full bg-neutral-950 text-white">
      <TripEditor item={item} />
    </main>
  );
}
