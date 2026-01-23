"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useNewItemStore } from "@/store/newItemStore";
import { uploadToMyDrive } from "@/lib/uploadToMyDrive";
import { createMyDriveRow } from "@/lib/createMyDriveRow";

export default function AddPage() {
  const {
    photo,
    observation,
    title,
    status,
    error,
    setObservation,
    setTitle,
    setStatus,
    setError,
    resetAll,
  } = useNewItemStore();

  const previewUrl = useMemo(() => {
    if (!photo) return null;
    return URL.createObjectURL(photo);
  }, [photo]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!photo) {
    return (
      <main className="min-h-dvh p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Ajouter</h1>
          <p className="text-sm opacity-80">
            Aucune photo détectée. Reviens à l’accueil et appuie sur AJOUTER.
          </p>
          <Link
            className="block w-full rounded-2xl px-6 py-4 font-semibold border"
            href="/"
          >
            Retour accueil
          </Link>
        </div>
      </main>
    );
  }

  async function handleFinalize() {
    try {
      // 🔒 Re-check ici (TS + runtime). Photo peut redevenir null entre-temps.
      const currentPhoto = photo;
      if (!currentPhoto) {
        throw new Error("Photo manquante.");
      }

      // Évite double submit
      if (status === "uploading") return;

      setStatus("uploading");

      const cleanTitle = title.trim();
      const cleanObs = observation.trim();

      if (!cleanObs) throw new Error("Observation manquante.");
      if (!cleanTitle) throw new Error("Titre manquant.");

      const { imagePath, publicUrl } = await uploadToMyDrive(currentPhoto);

      await createMyDriveRow({
        title: cleanTitle,
        observation: cleanObs,
        imagePath,
        imageUrl: publicUrl,
      });

      setStatus("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue.";
      setError(message);
    }
  }

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Ajout d’un document</h1>
        </header>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl ?? ""}
          alt="Prévisualisation"
          className="w-full rounded-2xl border"
        />

        {status === "observation" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Observations</h2>

            <textarea
              className="w-full min-h-[120px] rounded-2xl border p-4"
              placeholder="Décris ce qui a été photographié…"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />

            <button
              type="button"
              disabled={!observation.trim()}
              className="w-full rounded-2xl px-6 py-4 font-semibold border disabled:opacity-50"
              onClick={() => setStatus("title")}
            >
              Valider l’observation
            </button>
          </section>
        )}

        {status === "title" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Titre</h2>

            <input
              type="text"
              className="w-full rounded-2xl border p-4"
              placeholder="Titre du document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <button
              type="button"
              disabled={!title.trim()}
              className="w-full rounded-2xl px-6 py-4 font-semibold border disabled:opacity-50"
              onClick={handleFinalize}
            >
              Valider le titre
            </button>
          </section>
        )}

        {status === "uploading" && (
          <section className="space-y-4 text-center">
            <p className="text-sm opacity-80">Enregistrement en cours…</p>
          </section>
        )}

        {status === "success" && (
          <section className="space-y-4 text-center">
            <h2 className="text-lg font-semibold">C’est bon, merci ✅</h2>
            <button
              type="button"
              className="w-full rounded-2xl px-6 py-4 font-semibold border"
              onClick={resetAll}
            >
              Recommencer
            </button>
          </section>
        )}

        {status === "error" && (
          <section className="space-y-4 text-center">
            <h2 className="text-lg font-semibold">❌ Problème</h2>
            <p className="text-sm opacity-80">{error}</p>
            <button
              type="button"
              className="w-full rounded-2xl px-6 py-4 font-semibold border"
              onClick={resetAll}
            >
              Recommencer
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
