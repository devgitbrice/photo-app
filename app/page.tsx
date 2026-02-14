import Link from "next/link";
import AddButtonWithCamera from "@/components/AddButtonWithCamera";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-neutral-950 text-white">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-semibold">Photo App</h1>
        <p className="text-sm opacity-80">
          Ajoute une photo depuis l'appareil, puis renseigne un titre et une observation.
        </p>

        {/* Bouton principal : Scan */}
        <Link
          href="/quickscan"
          className="block w-full rounded-2xl px-6 py-5 text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Quick Scan !
        </Link>

        <AddButtonWithCamera />

        {/* --- SECTION CRÉATION --- */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/newdoc"
            className="flex items-center justify-center rounded-2xl px-4 py-4 font-semibold border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors text-sm"
          >
            Créer Doc
          </Link>

          {/* NOUVEAU BOUTON PYTHON */}
          <Link
            href="/newpython"
            className="flex items-center justify-center rounded-2xl px-4 py-4 font-semibold border border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-white transition-colors text-sm"
          >
            Script Python
          </Link>
        </div>

        {/* --- SECTION NAVIGATION --- */}
        <Link
          href="/mydrive"
          className="block w-full rounded-2xl px-6 py-4 font-semibold border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-all"
        >
          Voir MyDrive
        </Link>
      </div>
    </main>
  );
}