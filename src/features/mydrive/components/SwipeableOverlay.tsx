"use client";

import { useEffect, useState, useCallback } from "react";
import type { MyDriveItem } from "@/features/mydrive/types";

function filenameFromUrl(url: string, fallbackId: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop();
    return last && last.length > 0 ? last : `${fallbackId}.jpg`;
  } catch {
    return `${fallbackId}.jpg`;
  }
}

type Props = {
  items: MyDriveItem[];
  selectedIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onUpdate?: (id: string, updates: Partial<MyDriveItem>) => void;
};

export default function SwipeableOverlay({
  items,
  selectedIndex,
  onClose,
  onNavigate,
  onUpdate,
}: Props) {
  // --- Gestion du Swipe Tactile ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const currentItem = items[selectedIndex];

  // --- États pour l'édition ---
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(currentItem?.title || "");

  const [isEditingObs, setIsEditingObs] = useState(false);
  const [obsValue, setObsValue] = useState(currentItem?.observation || "");

  // Synchronisation quand l'item change
  useEffect(() => {
    if (currentItem) {
      setTitleValue(currentItem.title);
      setObsValue(currentItem.observation || "");
      setIsEditingTitle(false);
      setIsEditingObs(false);
    }
  }, [currentItem]);

  // Navigation helpers
  const goNext = useCallback(() => {
    if (selectedIndex < items.length - 1) {
      onNavigate(selectedIndex + 1);
    }
  }, [selectedIndex, items.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (selectedIndex > 0) {
      onNavigate(selectedIndex - 1);
    }
  }, [selectedIndex, onNavigate]);

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goNext();
    if (isRightSwipe) goPrev();
  };

  // Clavier (Flèches + Echap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas naviguer si on est en train d'éditer
      if (isEditingTitle || isEditingObs) {
        if (e.key === "Escape") {
          setIsEditingTitle(false);
          setIsEditingObs(false);
        }
        return;
      }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose, isEditingTitle, isEditingObs]);

  // --- Logique de sauvegarde ---
  const saveTitle = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() !== currentItem?.title && onUpdate && currentItem) {
      onUpdate(currentItem.id, { title: titleValue.trim() });
    }
  };

  const saveObs = () => {
    setIsEditingObs(false);
    if (obsValue?.trim() !== currentItem?.observation && onUpdate && currentItem) {
      onUpdate(currentItem.id, { observation: obsValue.trim() });
    }
  };

  if (!currentItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Compteur - toujours visible */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none z-20">
        {selectedIndex + 1} / {items.length}
      </div>

      {/* Boutons en haut à droite */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
        <a
          href={currentItem.image_url}
          download={filenameFromUrl(currentItem.image_url, currentItem.id)}
          className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Télécharger
        </a>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white text-2xl p-2"
        >
          ✕
        </button>
      </div>

      {/* Layout Mobile: Image centrée avec titre en bas */}
      <div className="md:hidden w-full h-full flex flex-col items-center justify-center p-2">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentItem.image_url}
            alt={currentItem.title}
            className="max-w-full max-h-[85dvh] object-contain rounded shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
        <div className="absolute bottom-8 text-white text-center px-4 max-w-2xl pointer-events-none">
          <h2 className="text-lg font-semibold">{currentItem.title}</h2>
        </div>
      </div>

      {/* Layout Desktop/Tablet: Split View */}
      <div className="hidden md:flex w-full h-full">
        {/* Moitié gauche - Image */}
        <div className="w-1/2 h-full flex items-center justify-center relative p-4">
          {/* Flèche Gauche */}
          {selectedIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors z-10"
            >
              ←
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentItem.image_url}
            alt={currentItem.title}
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {/* Flèche Droite */}
          {selectedIndex < items.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors z-10"
            >
              →
            </button>
          )}
        </div>

        {/* Moitié droite - Détails */}
        <div
          className="w-1/2 h-full flex flex-col p-8 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Titre éditable */}
          <div className="mb-6">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                autoFocus
                className="w-full bg-neutral-900 text-white text-2xl font-bold border border-blue-500 rounded-lg px-4 py-3 outline-none"
                placeholder="Titre du document"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl font-bold text-white cursor-text hover:text-blue-400 transition-colors py-2"
                title="Cliquer pour modifier"
              >
                {titleValue || <span className="italic opacity-50">Ajouter un titre...</span>}
              </h2>
            )}
          </div>

          {/* Description éditable */}
          <div className="mb-8 flex-1">
            <label className="block text-sm text-neutral-400 mb-2 uppercase tracking-wide">
              Description
            </label>
            {isEditingObs ? (
              <textarea
                value={obsValue}
                onChange={(e) => setObsValue(e.target.value)}
                onBlur={saveObs}
                autoFocus
                rows={6}
                className="w-full bg-neutral-900 text-gray-200 border border-blue-500 rounded-lg p-4 outline-none resize-none"
                placeholder="Ajouter une description..."
              />
            ) : (
              <p
                onClick={() => setIsEditingObs(true)}
                className="text-gray-300 cursor-text hover:text-white transition-colors min-h-[100px] whitespace-pre-wrap"
                title="Cliquer pour modifier"
              >
                {obsValue || <span className="italic opacity-50">Ajouter une description...</span>}
              </p>
            )}
          </div>

          {/* Section Tags (placeholder) */}
          <div className="border-t border-neutral-800 pt-6">
            <label className="block text-sm text-neutral-400 mb-3 uppercase tracking-wide">
              Mots-clés
            </label>
            <div className="text-neutral-500 italic text-sm">
              Les tags seront disponibles prochainement...
            </div>
          </div>

          {/* Métadonnées */}
          <div className="mt-auto pt-6 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 space-y-1">
              <p>ID: <span className="font-mono">{currentItem.id.slice(0, 8)}...</span></p>
              <p>Créé le: {new Date(currentItem.created_at).toLocaleDateString("fr-FR", {
                dateStyle: "long",
              })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
