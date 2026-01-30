"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadToMyDrive } from "@/lib/uploadToMyDrive";
import { createMyDriveRow } from "@/lib/createMyDriveRow";

type ScanStatus = "camera" | "preview" | "uploading";

export default function QuickScanPage() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>("camera");
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Ouvre l'appareil photo automatiquement
  const openCamera = useCallback(() => {
    setPhoto(null);
    setPreviewUrl(null);
    setStatus("camera");
    setError(null);
    // Petit délai pour s'assurer que l'input est prêt
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 100);
  }, []);

  // Ouvre la caméra au premier chargement
  useEffect(() => {
    openCamera();
  }, [openCamera]);

  // Nettoyage de l'URL de preview
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.currentTarget.value = ""; // Reset pour pouvoir reprendre la même photo

    if (!file) {
      // L'utilisateur a annulé - on reste sur camera
      return;
    }

    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("preview");
    setError(null);
  };

  const handleUpload = async (andFinish: boolean) => {
    if (!photo) return;

    setStatus("uploading");
    setError(null);

    try {
      // Upload vers le cloud
      const { imagePath, publicUrl } = await uploadToMyDrive(photo);

      // Créer l'entrée en DB avec titre et observation vides (à compléter plus tard)
      await createMyDriveRow({
        title: "",
        observation: "",
        imagePath,
        imageUrl: publicUrl,
      });

      setUploadCount((c) => c + 1);

      if (andFinish) {
        // Valider et terminer -> vers MyDrive
        router.push("/mydrive");
      } else {
        // Valider -> continuer à scanner
        openCamera();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      setStatus("preview");
    }
  };

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

  return (
    <main className="min-h-dvh flex flex-col bg-neutral-900 text-white">
      {/* Input caméra caché */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={hiddenInputStyle}
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-700">
        <button
          onClick={() => router.push("/")}
          className="text-neutral-400 hover:text-white"
        >
          Annuler
        </button>
        <h1 className="text-lg font-semibold">Quick Scan</h1>
        <div className="text-sm text-neutral-400">
          {uploadCount > 0 && `${uploadCount} scan${uploadCount > 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {status === "camera" && (
          <div className="text-center space-y-6">
            <div className="text-6xl">📷</div>
            <p className="text-neutral-400">
              Appuyez pour prendre une photo
            </p>
            <button
              onClick={openCamera}
              className="w-full max-w-xs rounded-2xl px-6 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            >
              Ouvrir l'appareil photo
            </button>
          </div>
        )}

        {status === "preview" && previewUrl && (
          <div className="w-full max-w-md space-y-4">
            {/* Preview de l'image */}
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-[50vh] object-contain"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/30 rounded-xl p-3">
                {error}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={() => handleUpload(false)}
                className="flex-1 rounded-2xl px-4 py-4 font-semibold bg-blue-600 hover:bg-blue-700"
              >
                Valider
              </button>
              <button
                onClick={() => handleUpload(true)}
                className="flex-1 rounded-2xl px-4 py-4 font-semibold bg-green-600 hover:bg-green-700"
              >
                Valider et terminer
              </button>
            </div>

            {/* Bouton reprendre */}
            <button
              onClick={openCamera}
              className="w-full rounded-2xl px-4 py-3 font-medium text-neutral-400 border border-neutral-600 hover:border-neutral-500"
            >
              Reprendre la photo
            </button>
          </div>
        )}

        {status === "uploading" && (
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">☁️</div>
            <p className="text-neutral-400">Envoi en cours...</p>
          </div>
        )}
      </div>

      {/* Footer avec raccourci MyDrive */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={() => router.push("/mydrive")}
          className="w-full rounded-2xl px-4 py-3 font-medium text-neutral-400 border border-neutral-600 hover:border-neutral-500"
        >
          Aller sur MyDrive
          {uploadCount > 0 && ` (${uploadCount} nouveau${uploadCount > 1 ? "x" : ""})`}
        </button>
      </div>
    </main>
  );
}
