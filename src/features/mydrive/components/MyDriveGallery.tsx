"use client";

import { useMemo, useState, useEffect } from "react";
import type { MyDriveItem, MyDriveListProps } from "@/features/mydrive/types";
import MyDriveCard from "@/features/mydrive/components/MyDriveCard";
// 👇 C'est ici qu'on importe depuis ton nouveau fichier "modify"
import { updateDriveItemAction } from "@/features/mydrive/modify";

export default function MyDriveGallery({ items: initialItems }: MyDriveListProps) {
  const [items, setItems] = useState<MyDriveItem[]>(initialItems);
  const [size, setSize] = useState<number>(50);
  const [openItem, setOpenItem] = useState<MyDriveItem | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const imageHeightClass = useMemo(() => {
    if (size <= 33) return "h-36 md:h-40";
    if (size <= 66) return "h-48 md:h-56";
    return "h-64 md:h-72";
  }, [size]);

  const gridClass = useMemo(() => {
    if (size <= 33) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    if (size <= 66) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2";
  }, [size]);

  const handleUpdateItem = async (id: string, updates: Partial<MyDriveItem>) => {
    // 1. Mise à jour visuelle immédiate (Optimistic UI)
    const previousItems = [...items];
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );

    try {
      // 2. Sauvegarde réelle via ton fichier modify.ts
      await updateDriveItemAction(id, updates);
      console.log("✅ Sauvegardé en BDD");
    } catch (error) {
      console.error("❌ Erreur sauvegarde", error);
      setItems(previousItems); // On annule si erreur
      alert("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <>
      <section className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm opacity-70">
            {items.length} élément{items.length > 1 ? "s" : ""}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">
              Taille images
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-44 cursor-pointer"
            />
          </div>
        </div>

        {/* Grid */}
        <div className={`grid gap-4 ${gridClass}`}>
          {items.map((item) => (
            <MyDriveCard
              key={item.id}
              item={item}
              imageHeightClass={imageHeightClass}
              onOpen={setOpenItem}
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>
      </section>

      {/* Fullscreen overlay */}
      {openItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center"
          onClick={() => setOpenItem(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={openItem.image_url}
            alt={openItem.title}
            className="w-full max-h-[85dvh] object-contain rounded-2xl cursor-zoom-out"
            onClick={() => setOpenItem(null)}
          />
        </div>
      )}
    </>
  );
}