"use client";

import { useMemo, useState, useEffect } from "react";
import type { MyDriveItem, MyDriveListProps } from "@/features/mydrive/types";
import MyDriveCard from "@/features/mydrive/components/MyDriveCard";
import SwipeableOverlay from "@/features/mydrive/components/SwipeableOverlay";
import { updateDriveItemAction } from "@/features/mydrive/modify";

export default function MyDriveGallery({ items: initialItems }: MyDriveListProps) {
  const [items, setItems] = useState<MyDriveItem[]>(initialItems);
  const [size, setSize] = useState<number>(50);
  
  // -1 = fermé, sinon index de l'image ouverte
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

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

  // Ouverture
  const handleOpen = (item: MyDriveItem) => {
    const index = items.findIndex((i) => i.id === item.id);
    setSelectedIndex(index);
  };

  // Update Action
  const handleUpdateItem = async (id: string, updates: Partial<MyDriveItem>) => {
    const previousItems = [...items];
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );

    try {
      await updateDriveItemAction(id, updates);
      console.log("✅ Sauvegardé en BDD");
    } catch (error) {
      console.error("❌ Erreur sauvegarde", error);
      setItems(previousItems);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  // Liste de tes liens
  const myLinks = [
    { name: "Vercel", url: "https://vercel.com/bricems-projects/photo-app" },
    { name: "GitHub", url: "https://github.com/devgitbrice/photo-app" },
    { name: "Formation", url: "https://formations-seven.vercel.app" },
    { name: "Muxeo", url: "https://muxeo.vercel.app/" },
    { name: "Fullcrea", url: "https://fullcrea.vercel.app/" },
    { name: "BriceGPT", url: "https://bricegpt.vercel.app/" },
    { name: "ToutesMesApps", url: "https://toutes-mes-apps.vercel.app/" },
  ];

  return (
    <>
      <section className="space-y-4 min-h-[80vh] flex flex-col">
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
        <div className={`grid gap-4 ${gridClass} flex-1`}>
          {items.map((item) => (
            <MyDriveCard
              key={item.id}
              item={item}
              imageHeightClass={imageHeightClass}
              onOpen={handleOpen}
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>

        {/* 👇 NOUVEAU : Footer avec tes liens */}
        <footer className="mt-12 pt-8 pb-4 border-t border-neutral-800">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {myLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-500 hover:text-white transition-colors hover:underline underline-offset-4"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="text-center mt-4 text-xs text-neutral-700">
            © {new Date().getFullYear()} MyDrive Ecosystem
          </div>
        </footer>
      </section>

      {/* Overlay Swipeable */}
      {selectedIndex >= 0 && (
        <SwipeableOverlay
          items={items}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(-1)}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  );
}