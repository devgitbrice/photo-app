"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNewItemStore } from "@/store/newItemStore";
import { uploadToMyDrive } from "@/lib/uploadToMyDrive";
import { createMyDriveRow } from "@/lib/createMyDriveRow";

const MAX_PHOTOS = 10;

export default function AddMultiPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const {
    photos,
    observation,
    title,
    multiStatus,
    currentUploadIndex,
    error,
    addPhoto,
    removePhoto,
    setObservation,
    setTitle,
    setMultiStatus,
    setCurrentUploadIndex,
    setError,
    resetAll,
  } = useNewItemStore();

  // Générer les URLs de prévisualisation
  const previewUrls = useMemo(() => {
    return photos.map((photo) => URL.createObjectURL(photo));
  }, [photos]);

  // Nettoyer les URLs à la destruction
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Rediriger si pas en mode multi
  useEffect(() => {
    if (multiStatus === "idle") {
      router.push("/");
    }
  }, [multiStatus, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    addPhoto(file);
    e.currentTarget.value = "";
  };

  const handleFinishCapturing = () => {
    if (photos.length === 0) return;
    setMultiStatus("observation");
  };

  const handleValidateObservation = () => {
    if (!observation.trim()) return;
    setMultiStatus("title");
  };

  async function handleFinalize() {
    try {
      if (photos.length === 0) {
        throw new Error("Aucune photo à enregistrer.");
      }

      if (multiStatus === "uploading") return;

      setMultiStatus("uploading");

      const cleanTitle = title.trim();
      const cleanObs = observation.trim();

      if (!cleanObs) throw new Error("Observation manquante.");
      if (!cleanTitle) throw new Error("Titre manquant.");

      // Upload de toutes les photos
      for (let i = 0; i < photos.length; i++) {
        setCurrentUploadIndex(i);
        const photo = photos[i];

        const { imagePath, publicUrl } = await uploadToMyDrive(photo);

        // Pour le titre, on ajoute un numéro si plusieurs photos
        const photoTitle =
          photos.length > 1 ? `${cleanTitle} (${i + 1}/${photos.length})` : cleanTitle;

        await createMyDriveRow({
          title: photoTitle,
          observation: cleanObs,
          imagePath,
          imageUrl: publicUrl,
        });
      }

      setMultiStatus("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue.";
      setError(message);
    }
  }

  const hiddenInputStyle: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  // Page de capture
  if (multiStatus === "capturing") {
    return (
      <main className="min-h-dvh p-6">
        <div className="mx-auto w-full max-w-md space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">Mode Multi-Image</h1>
            <p className="text-sm opacity-80">
              {photos.length}/{MAX_PHOTOS} photos
            </p>
          </header>

          {/* Input caché pour appareil photo */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={hiddenInputStyle}
            onChange={handleFileChange}
          />

          {/* Grille des photos capturées */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold flex items-center justify-center"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Zone d'ajout */}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-32 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <span className="text-4xl">📷</span>
              <span className="text-sm opacity-80">
                Ajouter une photo ({photos.length}/{MAX_PHOTOS})
              </span>
            </button>
          )}

          {/* Boutons d'action */}
          <div className="space-y-3 pt-4">
            <button
              type="button"
              disabled={photos.length === 0}
              onClick={handleFinishCapturing}
              className="w-full rounded-2xl px-6 py-4 font-semibold bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Terminer ({photos.length} photo{photos.length > 1 ? "s" : ""})
            </button>

            <button
              type="button"
              onClick={() => {
                resetAll();
                router.push("/");
              }}
              className="w-full rounded-2xl px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400"
            >
              Annuler
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Page d'observation
  if (multiStatus === "observation") {
    return (
      <main className="min-h-dvh p-6">
        <div className="mx-auto w-full max-w-md space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">Description</h1>
            <p className="text-sm opacity-80">
              Pour {photos.length} photo{photos.length > 1 ? "s" : ""}
            </p>
          </header>

          {/* Aperçu miniatures */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previewUrls.map((url, index) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={index}
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
              />
            ))}
          </div>

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
              onClick={handleValidateObservation}
            >
              Valider l'observation
            </button>
          </section>
        </div>
      </main>
    );
  }

  // Page de titre
  if (multiStatus === "title") {
    return (
      <main className="min-h-dvh p-6">
        <div className="mx-auto w-full max-w-md space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">Titre</h1>
            <p className="text-sm opacity-80">
              Pour {photos.length} photo{photos.length > 1 ? "s" : ""}
            </p>
          </header>

          {/* Aperçu miniatures */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previewUrls.map((url, index) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={index}
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
              />
            ))}
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Titre du document</h2>

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
              Valider et enregistrer
            </button>
          </section>
        </div>
      </main>
    );
  }

  // Page d'upload en cours
  if (multiStatus === "uploading") {
    return (
      <main className="min-h-dvh p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-semibold">Enregistrement en cours…</h1>
          <p className="text-sm opacity-80">
            Photo {currentUploadIndex + 1} sur {photos.length}
          </p>

          {/* Barre de progression */}
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentUploadIndex + 1) / photos.length) * 100}%`,
              }}
            />
          </div>

          {/* Aperçu de la photo en cours */}
          {previewUrls[currentUploadIndex] && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrls[currentUploadIndex]}
              alt={`Photo ${currentUploadIndex + 1}`}
              className="w-32 h-32 object-cover rounded-xl border mx-auto"
            />
          )}
        </div>
      </main>
    );
  }

  // Page de succès
  if (multiStatus === "success") {
    return (
      <main className="min-h-dvh p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-semibold">C'est bon, merci ✅</h1>
          <p className="text-sm opacity-80">
            {photos.length} photo{photos.length > 1 ? "s" : ""} enregistrée
            {photos.length > 1 ? "s" : ""}
          </p>

          <button
            type="button"
            className="w-full rounded-2xl px-6 py-4 font-semibold border"
            onClick={() => {
              resetAll();
              router.push("/");
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  // Page d'erreur
  if (multiStatus === "error") {
    return (
      <main className="min-h-dvh p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-semibold">❌ Problème</h1>
          <p className="text-sm opacity-80">{error}</p>

          <button
            type="button"
            className="w-full rounded-2xl px-6 py-4 font-semibold border"
            onClick={() => {
              resetAll();
              router.push("/");
            }}
          >
            Recommencer
          </button>
        </div>
      </main>
    );
  }

  // Fallback - redirection vers accueil
  return (
    <main className="min-h-dvh p-6 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Mode Multi-Image</h1>
        <p className="text-sm opacity-80">
          Aucune session en cours. Retournez à l'accueil pour commencer.
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
