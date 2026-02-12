"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MyDriveItem, MyDriveListProps, Tag } from "@/features/mydrive/types";
import SwipeableOverlay from "@/features/mydrive/components/SwipeableOverlay";
import { updateDriveItemAction, deleteDriveItemAction } from "@/features/mydrive/modify";

export default function MyDriveGallery({ items: initialItems, allTags: initialTags }: MyDriveListProps) {
  const [items, setItems] = useState<MyDriveItem[]>(initialItems);
  const [allTags, setAllTags] = useState<Tag[]>(initialTags);
  const [size, setSize] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Mise à jour des props si elles changent
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setAllTags(initialTags);
  }, [initialTags]);

  // --- CALCULS TAILLE & GRILLE ---
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

  // --- FILTRAGE ---
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedTagId) {
      result = result.filter((item) =>
        item.tags?.some((t) => t.id === selectedTagId)
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.observation && item.observation.toLowerCase().includes(query))
      );
    }
    return result;
  }, [items, searchQuery, selectedTagId]);

  // --- STATISTIQUES TAGS ---
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      for (const tag of item.tags || []) {
        counts[tag.id] = (counts[tag.id] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  // --- NAVIGATION CLAVIER ---
  const tagIdList = useMemo<(string | null)[]>(
    () => [null, ...allTags.map((t) => t.id)],
    [allTags]
  );

  const navigateTag = useCallback(
    (direction: "up" | "down") => {
      const currentIndex = tagIdList.indexOf(selectedTagId);
      const nextIndex =
        direction === "down"
          ? Math.min(currentIndex + 1, tagIdList.length - 1)
          : Math.max(currentIndex - 1, 0);
      setSelectedTagId(tagIdList[nextIndex]);
    },
    [tagIdList, selectedTagId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex >= 0) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateTag("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateTag("up");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateTag, selectedIndex]);

  // --- ACTIONS ---
  const handleOpen = (item: MyDriveItem) => {
    const index = filteredItems.findIndex((i) => i.id === item.id);
    setSelectedIndex(index);
  };

  const handleUpdateItem = async (id: string, updates: Partial<MyDriveItem>) => {
    const previousItems = [...items];
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
    try {
        const dbUpdates: Record<string, string> = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.observation) dbUpdates.observation = updates.observation;
        await updateDriveItemAction(id, dbUpdates);
    } catch (error) {
      console.error("Erreur sauvegarde", error);
      setItems(previousItems);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handleTagsChange = (itemId: string, newTags: Tag[]) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, tags: newTags } : item
      )
    );
  };

  const handleNewTagCreated = (tag: Tag) => {
    setAllTags((prev) => {
      if (prev.some((t) => t.id === tag.id)) return prev;
      return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleDeleteItem = async (id: string, imagePath: string) => {
    const previousItems = [...items];
    const deletedIndex = items.findIndex((item) => item.id === id);
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));

    if (selectedIndex >= 0) {
      if (items.length <= 1) {
        setSelectedIndex(-1);
      } else if (selectedIndex >= deletedIndex && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
    try {
      await deleteDriveItemAction(id, imagePath);
    } catch (error) {
      console.error("Erreur suppression", error);
      setItems(previousItems);
      alert("Erreur lors de la suppression.");
    }
  };

  const myLinks = [
    { name: "Vercel", url: "https://vercel.com/bricems-projects/photo-app" },
    { name: "GitHub", url: "https://github.com/devgitbrice/photo-app" },
    { name: "Formation", url: "https://formations-seven.vercel.app" },
    { name: "Muxeo", url: "https://muxeo.vercel.app/" },
    { name: "Fullcrea", url: "https://fullcrea.vercel.app/" },
    { name: "BriceGPT", url: "https://bricegpt.vercel.app/" },
    { name: "ToutesMesApps", url: "https://toutes-mes-apps.vercel.app/" },
  ];

  // --- RENDU CARTE (SÉCURISÉ) ---
  const renderCardContent = (item: MyDriveItem) => {
    // SÉCURITÉ : On nettoie l'URL avant de l'utiliser
    const rawUrl = item.url ? item.url.trim() : "";
    const validUrl = rawUrl.length > 0 ? rawUrl : null;

    return (
      <>
        {/* Zone Image / Icône */}
        <div className={`${imageHeightClass} w-full bg-neutral-950 relative overflow-hidden flex items-center justify-center`}>
          
          {/* Si validUrl existe, on affiche l'image, sinon l'icône */}
          {validUrl ? (
            <img
              src={validUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            // FALLBACK : Icônes vectorielles
            <div className="flex flex-col items-center justify-center text-neutral-700 group-hover:text-blue-500 transition-colors">
               {item.type === "folder" ? (
                  <svg className="w-16 h-16 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" /></svg>
               ) : (
                  <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               )}
            </div>
          )}

          {/* Badge Type */}
          {(item.doc_type || item.type === 'folder') && (
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${
                item.type === 'folder' 
                  ? "bg-yellow-500/20 text-yellow-200 border-yellow-500/30" 
                  : "bg-blue-500/20 text-blue-200 border-blue-500/30"
              }`}>
                {item.type === 'folder' ? 'DOSSIER' : item.doc_type}
              </div>
          )}
        </div>

        {/* Info Content */}
        <div className="p-3 flex flex-col gap-1 bg-neutral-900 border-t border-neutral-800">
          <h3 className="font-medium text-neutral-200 truncate text-sm group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wide">
            {/* CORRECTION : suppressHydrationWarning ajouté ici */}
            <span suppressHydrationWarning>
              {item.created_at ? format(new Date(item.created_at), "dd MMM", { locale: fr }) : "-"}
            </span>
            {item.tags && item.tags.length > 0 && (
               <div className="flex gap-1">
                 {item.tags.slice(0, 3).map((tag, idx) => (
                   <span key={idx} className="w-2 h-2 rounded-full ring-1 ring-neutral-900" style={{ backgroundColor: tag.color }} title={tag.name} />
                 ))}
               </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="flex gap-6">
        {/* Sidebar Tags */}
        {allTags.length > 0 && (
          <aside className="hidden md:block w-48 shrink-0">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Tags
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedTagId(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedTagId ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                Tous ({items.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${
                    selectedTagId === tag.id ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <span>{tag.name}</span>
                  <span className="opacity-60 text-xs py-0.5">({tagCounts[tag.id] || 0})</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <section className="space-y-4 min-h-[80vh] flex flex-col flex-1 min-w-0">
          
          {/* Controls Mobile & Desktop */}
          <div className="flex flex-col gap-3">
            {allTags.length > 0 && (
              <div className="md:hidden overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max">
                  <button onClick={() => setSelectedTagId(null)} className={`px-3 py-1.5 rounded-full text-sm ${!selectedTagId ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>Tous</button>
                  {allTags.map((tag) => (
                    <button key={tag.id} onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)} className={`px-3 py-1.5 rounded-full text-sm ${selectedTagId === tag.id ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>{tag.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm opacity-70">
                {filteredItems.length} élément{filteredItems.length > 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-1.5 pl-9 outline-none focus:border-blue-500 text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Taille</span>
                  <input type="range" min={0} max={100} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className={`grid gap-4 ${gridClass} flex-1 content-start`}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const wrapperClass = "group relative flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-900/20 cursor-pointer";
                
                if (item.type === 'folder') {
                    return (
                        <Link key={item.id} href={`/mydrive/folder/${item.id}`} className={wrapperClass}>
                            {renderCardContent(item)}
                        </Link>
                    );
                }
                
                return (
                    <div key={item.id} onClick={() => handleOpen(item)} className={wrapperClass}>
                        {renderCardContent(item)}
                    </div>
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-500">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <p>Aucun document trouvé</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 pb-4 border-t border-neutral-800">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {myLinks.map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 hover:text-white hover:underline underline-offset-4">
                  {link.name}
                </a>
              ))}
            </div>
            <div className="text-center mt-4 text-xs text-neutral-700">
              &copy; {new Date().getFullYear()} MyDrive Ecosystem
            </div>
          </footer>
        </section>
      </div>

      {/* Overlay Swipeable */}
      {selectedIndex >= 0 && (
        <SwipeableOverlay
          items={filteredItems}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(-1)}
          onNavigate={setSelectedIndex}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          allTags={allTags}
          onTagsChange={handleTagsChange}
          onNewTagCreated={handleNewTagCreated}
        />
      )}
    </>
  );
}