import Link from "next/link";
import { fetchMyDrive } from "@/features/mydrive/lib/fetchMyDrive";
import MyDriveGallery from "@/features/mydrive/components/MyDriveGallery";

// On empêche le prerender (Supabase + env vars)
export const dynamic = "force-dynamic";

export default async function MyDrivePage() {
  const items = await fetchMyDrive();

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MyDrive</h1>

        <Link
          href="/"
          className="rounded-2xl px-4 py-2 font-semibold border"
        >
          Ajouter
        </Link>
      </header>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="text-center space-y-4 opacity-80">
          <p>Aucun document pour le moment.</p>
          <Link
            href="/"
            className="inline-block rounded-2xl px-6 py-3 font-semibold border"
          >
            Ajouter un document
          </Link>
        </div>
      ) : (
        <MyDriveGallery items={items} />
      )}
    </main>
  );
}
