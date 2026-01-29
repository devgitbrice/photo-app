"use client";

import { useMemo, useState, useEffect } from "react";
import type { MyDriveItem, MyDriveListProps } from "@/features/mydrive/types";
import MyDriveCard from "@/features/mydrive/components/MyDriveCard";
import SwipeableOverlay from "@/features/mydrive/components/SwipeableOverlay";
import { updateDriveItemAction, deleteDriveItemAction } from "@/features/mydrive/modify";

export default function MyDriveGallery({ items: initialItems }: MyDriveListProps) {
  const [items, setItems] = useState<MyDriveItem[]>(initialItems);
  const [size, setSize] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Filtrage par recherche (titre ou description)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.observation && item.observation.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Ouverture
  const handleOpen = (item: MyDriveItem) => {
    const index = filteredItems.findIndex((i) => i.id === item.id);
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

  // Delete Action
  const handleDeleteItem = async (id: string, imagePath: string) => {
    const previousItems = [...items];
    const deletedIndex = items.findIndex((item) => item.id === id);

    // Supprimer de l'état local
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));

    // Ajuster l'index sélectionné
    if (selectedIndex >= 0) {
      if (items.length <= 1) {
        // Dernier item, fermer l'overlay
        setSelectedIndex(-1);
      } else if (selectedIndex >= deletedIndex && selectedIndex > 0) {
        // Reculer d'un cran si on supprime l'item actuel ou un précédent
        setSelectedIndex(selectedIndex - 1);
      }
    }

    try {
      await deleteDriveItemAction(id, imagePath);
      console.log("✅ Document supprimé");
    } catch (error) {
      console.error("❌ Erreur suppression", error);
      setItems(previousItems);
      alert("Erreur lors de la suppression.");
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
        <div className="flex flex-col gap-3">
          {/* Barre de recherche - pleine largeur sur mobile */}
          <div className="w-full sm:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par titre ou description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-2 pl-10 outline-none focus:border-blue-500 transition-colors text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Ligne avec compteur, recherche desktop et taille */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm opacity-70">
              {filteredItems.length} élément{filteredItems.length > 1 ? "s" : ""}
              {searchQuery && items.length !== filteredItems.length && (
                <span className="text-neutral-500"> sur {items.length}</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Barre de recherche - desktop uniquement */}
              <div className="hidden sm:block relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-64 bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-1.5 pl-9 outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
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
          </div>
        </div>

        {/* Grid */}
        <div className={`grid gap-4 ${gridClass} flex-1`}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <MyDriveCard
                key={item.id}
                item={item}
                imageHeightClass={imageHeightClass}
                onOpen={handleOpen}
                onUpdate={handleUpdateItem}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-500">
              <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">Aucun document trouv&eacute;</p>
              <p className="text-sm mt-1">Essayez avec d&apos;autres mots-cl&eacute;s</p>
            </div>
          )}
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
          items={filteredItems}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(-1)}
          onNavigate={setSelectedIndex}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </>
  );
}