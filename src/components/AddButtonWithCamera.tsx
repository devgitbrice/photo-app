"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNewItemStore } from "@/store/newItemStore";

export default function AddButtonWithCamera() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const multiCameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCameraSubmenuOpen, setIsCameraSubmenuOpen] = useState(false);
  const router = useRouter();
  const setPhoto = useNewItemStore((s) => s.setPhoto);
  const { setMultiMode, addPhoto, photos } = useNewItemStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setPhoto(file);

    // reset pour pouvoir reprendre la même photo
    e.currentTarget.value = "";

    setIsMenuOpen(false);
    setIsCameraSubmenuOpen(false);
    router.push("/add");
  };

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    addPhoto(file);

    // reset pour pouvoir reprendre une autre photo
    e.currentTarget.value = "";
  };

  const handleStartMultiMode = () => {
    setMultiMode(true);
    setIsMenuOpen(false);
    setIsCameraSubmenuOpen(false);
    router.push("/add-multi");
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
    <div className="w-full relative">
      {/* Input pour appareil photo (avec capture) - 1 image */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={hiddenInputStyle}
        onChange={handleFileChange}
      />

      {/* Input pour appareil photo multi-images */}
      <input
        ref={multiCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={hiddenInputStyle}
        onChange={handleMultiFileChange}
      />

      {/* Input pour photothèque (sans capture, ouvre la galerie) */}
      <input
        ref={photoLibraryInputRef}
        type="file"
        accept="image/*"
        style={hiddenInputStyle}
        onChange={handleFileChange}
      />

      {/* Input pour fichiers (accept élargi pour accéder à l'app Fichiers) */}
      <input
        ref={filesInputRef}
        type="file"
        accept="image/*,.pdf,.heic,.heif,.png,.jpg,.jpeg,.webp,.gif"
        style={hiddenInputStyle}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="w-full rounded-2xl px-6 py-5 text-lg font-semibold shadow-sm border"
      >
        AJOUTER
      </button>

      {/* Menu modal principal */}
      {isMenuOpen && !isCameraSubmenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-t-2xl p-4 pb-8 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Choisir une source
            </div>

            <button
              type="button"
              onClick={() => setIsCameraSubmenuOpen(true)}
              className="w-full rounded-xl px-4 py-4 text-left font-medium bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-3"
            >
              <span className="text-2xl">📷</span>
              <div>
                <div>Appareil photo</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Prendre une ou plusieurs photos
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => photoLibraryInputRef.current?.click()}
              className="w-full rounded-xl px-4 py-4 text-left font-medium bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-3"
            >
              <span className="text-2xl">🖼️</span>
              <div>
                <div>Photothèque</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Choisir une photo existante
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => filesInputRef.current?.click()}
              className="w-full rounded-xl px-4 py-4 text-left font-medium bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-3"
            >
              <span className="text-2xl">📁</span>
              <div>
                <div>Fichiers</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Parcourir vos fichiers
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="w-full rounded-xl px-4 py-3 text-center font-medium text-neutral-500 dark:text-neutral-400 mt-2"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Sous-menu Appareil photo : 1 Image / Multi-Image */}
      {isMenuOpen && isCameraSubmenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => {
            setIsCameraSubmenuOpen(false);
            setIsMenuOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-t-2xl p-4 pb-8 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Mode de capture
            </div>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full rounded-xl px-4 py-4 text-left font-medium bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-3"
            >
              <span className="text-2xl">1️⃣</span>
              <div>
                <div>1 Image</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Prendre une seule photo
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleStartMultiMode}
              className="w-full rounded-xl px-4 py-4 text-left font-medium bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-3"
            >
              <span className="text-2xl">📸</span>
              <div>
                <div>Multi-Image</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Prendre plusieurs photos (jusqu'à 10)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraSubmenuOpen(false)}
              className="w-full rounded-xl px-4 py-3 text-center font-medium text-neutral-500 dark:text-neutral-400 mt-2"
            >
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
