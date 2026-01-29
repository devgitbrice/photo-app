"use client";

import { useEffect, useState } from "react";
import type { MyDriveItem } from "@/features/mydrive/types";

type Props = {
  item?: MyDriveItem;
  imageHeightClass: string;
  onOpen: (item: MyDriveItem) => void;
  onUpdate?: (id: string, updates: Partial<MyDriveItem>) => void;
};

function filenameFromUrl(url: string, fallbackId: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop();
    return last && last.length > 0 ? last : `${fallbackId}.jpg`;
  } catch {
    return `${fallbackId}.jpg`;
  }
}

function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf');
}

export default function MyDriveCard({
  item,
  imageHeightClass,
  onOpen,
  onUpdate,
}: Props) {
  if (!item) return null;

  const [formattedDate, setFormattedDate] = useState<string>("");

  // --- États pour l'édition ---
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(item.title);

  const [isEditingObs, setIsEditingObs] = useState(false);
  const [obsValue, setObsValue] = useState(item.observation);

  // Synchronisation avec le parent (si la base de données met à jour)
  useEffect(() => {
    setTitleValue(item.title);
    setObsValue(item.observation);
  }, [item.title, item.observation]);

  useEffect(() => {
    if (!item.created_at) return;
    const d = new Date(item.created_at);
    if (Number.isNaN(d.getTime())) return;

    setFormattedDate(
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    );
  }, [item.created_at]);

  const downloadName = filenameFromUrl(item.image_url, item.id);

  // --- Logique de sauvegarde ---
  const saveTitle = () => {
    setIsEditingTitle(false);
    // On ne déclenche l'update que si ça a vraiment changé
    if (titleValue.trim() !== item.title && onUpdate) {
      onUpdate(item.id, { title: titleValue });
    }
  };

  const saveObs = () => {
    setIsEditingObs(false);
    if (obsValue?.trim() !== item.observation && onUpdate) {
      onUpdate(item.id, { observation: obsValue });
    }
  };

  return (
    // 🔴 1. FOND NOIR ET BORDURE SOMBRE ICI
    <article className="rounded-2xl border border-neutral-800 overflow-hidden shadow-sm flex flex-col h-full bg-neutral-900">
      
      {/* Zone Image */}
      <div className="relative shrink-0 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.title}
          className={`w-full ${imageHeightClass} object-cover cursor-zoom-in transition-opacity hover:opacity-90 ${isPdf(item.image_url) ? 'bg-white' : 'bg-neutral-800'}`}
          loading="lazy"
          onDoubleClick={() => onOpen(item)}
          title="Double-clic pour agrandir l'image"
        />

        {/* Boutons Détail et Télécharger (deviennent visibles au survol) */}
        <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(item);
            }}
            className="rounded-lg border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-black shadow-sm backdrop-blur hover:bg-white transition-colors"
          >
            Détail
          </button>
          <a
            href={item.image_url}
            download={downloadName}
            className="rounded-lg border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-black shadow-sm backdrop-blur hover:bg-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Télécharger
          </a>
        </div>
      </div>

      {/* Contenu Texte */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          
          {/* TITRE EDITABLE */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                autoFocus
                // 🔴 2. INPUT STYLE SOMBRE
                className="w-full bg-neutral-950 text-white border border-blue-500 rounded px-2 py-1 outline-none font-semibold text-base"
              />
            ) : (
              <h3
                onDoubleClick={() => setIsEditingTitle(true)}
                title="Double-clic pour modifier"
                // 🔴 3. TITRE EN BLANC
                className="font-semibold text-white leading-snug line-clamp-2 cursor-text hover:text-blue-400 transition-colors select-none"
              >
                {titleValue}
              </h3>
            )}
          </div>

          <span className="text-xs text-neutral-500 whitespace-nowrap shrink-0 pt-1">
            {formattedDate}
          </span>
        </div>

        {/* DESCRIPTION EDITABLE */}
        <div className="flex-1">
          {isEditingObs ? (
            <textarea
              value={obsValue || ""}
              onChange={(e) => setObsValue(e.target.value)}
              onBlur={saveObs}
              autoFocus
              rows={3}
              // 🔴 4. TEXTAREA STYLE SOMBRE
              className="w-full bg-neutral-950 text-gray-200 text-sm border border-blue-500 rounded p-2 outline-none resize-none"
            />
          ) : (
            <p
              onDoubleClick={() => setIsEditingObs(true)}
              title="Double-clic pour modifier"
              // 🔴 5. DESCRIPTION EN GRIS CLAIR
              className="text-sm text-gray-300 line-clamp-3 cursor-text hover:text-white transition-colors min-h-[1.5em]"
            >
              {obsValue || <span className="italic opacity-30 text-gray-500">Ajouter une description...</span>}
            </p>
          )}
        </div>

        <div className="pt-2 text-xs text-neutral-600 mt-auto">
          ID: <span className="font-mono">{item.id.slice(0, 8)}…</span>
        </div>
      </div>
    </article>
  );
}