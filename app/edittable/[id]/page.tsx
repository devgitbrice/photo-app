import { supabase } from "@/lib/supabaseClient";
import { fetchAllTags } from "@/features/mydrive/lib/fetchMyDrive";
import TableEditor from "@/features/table/components/TableEditor";
import { notFound } from "next/navigation";

export default async function EditTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: item, error }, allTags] = await Promise.all([
    supabase
      .from("MyDrive")
      .select("*, tags:mydrive_tags(tag_id)")
      .eq("id", id)
      .single(),
    fetchAllTags(),
  ]);

  if (error || !item) return notFound();

  const initialTags = allTags.filter((t) =>
    item.tags?.some((st: any) => st.tag_id === t.id)
  );

  return (
    <main className="h-dvh w-full bg-neutral-950 text-white overflow-hidden flex flex-col">
      <TableEditor
        initialData={{
          id: item.id,
          title: item.title,
          content: item.content || "",
          observation: item.observation || "",
          tags: initialTags,
        }}
      />
    </main>
  );
}
