import Link from "next/link";
import { fetchMyDrive, fetchAllTags } from "@/features/mydrive/lib/fetchMyDrive";
import MyDriveGallery from "@/features/mydrive/components/MyDriveGallery";

export const dynamic = "force-dynamic";

export default async function MyDrivePage() {
  const [items, allTags] = await Promise.all([fetchMyDrive(), fetchAllTags()]);

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">MyDrive</h1>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/newdoc" className="rounded-2xl px-4 py-2 text-sm font-semibold border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors">
            Créer Doc
          </Link>
          {/* NOUVEAU BOUTON PYTHON */}
          <Link href="/newpython" className="rounded-2xl px-4 py-2 text-sm font-semibold border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors">
            Script Python
          </Link>
          <Link href="/newmindmap" className="rounded-2xl px-4 py-2 text-sm font-semibold border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors">
            Créer Mindmap
          </Link>
          <Link href="/newtable" className="rounded-2xl px-4 py-2 text-sm font-semibold border border-green-600 text-green-400 hover:bg-green-600 hover:text-white transition-colors">
            Créer Table
          </Link>
          <Link href="/newpresentation" className="rounded-2xl px-4 py-2 text-sm font-semibold border border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white transition-colors">
            Créer Présentation
          </Link>
          <Link href="/" className="rounded-2xl px-4 py-2 text-sm font-semibold border hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            Ajouter
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="text-center space-y-4 opacity-80 mt-10">
          <p>Aucun document pour le moment.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/newdoc" className="rounded-2xl px-6 py-3 font-semibold border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors">
              Créer Doc
            </Link>
            <Link href="/newpython" className="rounded-2xl px-6 py-3 font-semibold border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors">
              Script Python
            </Link>
            <Link href="/newmindmap" className="rounded-2xl px-6 py-3 font-semibold border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors">
              Créer Mindmap
            </Link>
            <Link href="/newtable" className="rounded-2xl px-6 py-3 font-semibold border border-green-600 text-green-400 hover:bg-green-600 hover:text-white transition-colors">
              Créer Table
            </Link>
            <Link href="/newpresentation" className="rounded-2xl px-6 py-3 font-semibold border border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white transition-colors">
              Créer Présentation
            </Link>
          </div>
        </div>
      ) : (
        <MyDriveGallery items={items} allTags={allTags} />
      )}
    </main>
  );
}