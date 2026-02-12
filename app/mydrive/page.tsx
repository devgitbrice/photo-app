import Link from "next/link";
import { fetchMyDrive, fetchAllTags } from "@/features/mydrive/lib/fetchMyDrive";
import MyDriveGallery from "@/features/mydrive/components/MyDriveGallery";

// On empêche le prerender (Supabase + env vars)
export const dynamic = "force-dynamic";

export default async function MyDrivePage() {
  const [items, allTags] = await Promise.all([fetchMyDrive(), fetchAllTags()]);

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyDrive</h1>

        <div className="flex items-center gap-3">
          <Link
            href="/newdoc"
            className="rounded-2xl px-4 py-2 font-semibold border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
          >
            Créer Doc
          </Link>
          <Link
            href="/"
            className="rounded-2xl px-4 py-2 font-semibold border"
          >
            Ajouter
          </Link>
        </div>
      </header>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="text-center space-y-4 opacity-80">
          <p>Aucun document pour le moment.</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/newdoc"
              className="inline-block rounded-2xl px-6 py-3 font-semibold border border-blue-600 text-blue-400"
            >
              Créer un document
            </Link>
            <Link
              href="/"
              className="inline-block rounded-2xl px-6 py-3 font-semibold border"
            >
              Ajouter un scan
            </Link>
          </div>
        </div>
      ) : (
        <MyDriveGallery items={items} allTags={allTags} />
      )}
    </main>
  );
}
