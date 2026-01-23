"use client";

import { useEffect, useState, useCallback } from "react";
import type { MyDriveItem } from "@/features/mydrive/types";

type Props = {
  items: MyDriveItem[];
  selectedIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
};

export default function SwipeableOverlay({
  items,
  selectedIndex,
  onClose,
  onNavigate,
}: Props) {
  // --- Gestion du Swipe Tactile ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const currentItem = items[selectedIndex];

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
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  if (!currentItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Compteur */}
      <div className="absolute top-4 text-white/50 text-sm pointer-events-none">
        {selectedIndex + 1} / {items.length}
      </div>

      {/* Zone Image */}
      <div className="relative w-full h-full flex items-center justify-center p-2">
        
        {/* Flèche Gauche (Desktop) */}
        {selectedIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="hidden md:flex absolute left-4 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors z-10"
          >
            ←
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentItem.image_url}
          alt={currentItem.title}
          className="max-w-full max-h-[85dvh] object-contain rounded shadow-2xl select-none"
          onClick={(e) => e.stopPropagation()} 
          draggable={false} 
        />

        {/* Flèche Droite (Desktop) */}
        {selectedIndex < items.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="hidden md:flex absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors z-10"
          >
            →
          </button>
        )}
      </div>

      {/* Titre */}
      <div className="absolute bottom-8 text-white text-center px-4 max-w-2xl pointer-events-none">
        <h2 className="text-lg font-semibold">{currentItem.title}</h2>
      </div>
    </div>
  );
}