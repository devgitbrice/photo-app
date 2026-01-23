"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useNewItemStore } from "@/store/newItemStore";

export default function AddPage() {
  const photo = useNewItemStore((s) => s.photo);
  const reset = useNewItemStore((s) => s.reset);

  const previewUrl = useMemo(() => {
    if (!photo) return null;
    return URL.createObjectURL(photo);
  }, [photo]);

  if (!photo) {
    return (
      <main className="min-h-dvh p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Ajouter</h1>
          <p className="text-sm opacity-80">
            Aucune photo détectée. Reviens à l’accueil et appuie sur AJOUTER.
          </p>
          <Link className="block w-full rounded-2xl px-6 py-4 font-semibold border" href="/">
            Retour accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Photo prise ✅</h1>
          <p className="text-sm opacity-80">
            Prochaine étape : description + titre (puis upload Supabase).
          </p>
        </header>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl ?? ""} alt="Prévisualisation" className="w-full rounded-2xl border" />

        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-2xl px-6 py-4 font-semibold border"
            onClick={() => {
              // Ici on enchaîne vers l’étape description (on la crée juste après)
              alert("Next: écran Description/Titre");
            }}
          >
            Continuer
          </button>

          <button
            type="button"
            className="w-full rounded-2xl px-6 py-4 font-semibold border"
            onClick={() => reset()}
          >
            Supprimer / recommencer
          </button>
        </div>
      </div>
    </main>
  );
}
