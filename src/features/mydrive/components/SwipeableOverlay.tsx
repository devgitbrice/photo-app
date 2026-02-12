"use client";

import { useEffect, useState, useCallback } from "react";
import type { MyDriveItem, Tag } from "@/features/mydrive/types";
import ImageEditor from "./ImageEditor";
import TagSelector from "./TagSelector";
import { replaceImageAction, updateDriveContentAction } from "@/features/mydrive/modify";

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

type Props = {
  items: MyDriveItem[];
  selectedIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onUpdate?: (id: string, updates: Partial<MyDriveItem>) => void;
  onDelete?: (id: string, imagePath: string) => void;
  allTags: Tag[];
  onTagsChange: (itemId: string, newTags: Tag[]) => void;
  onNewTagCreated: (tag: Tag) => void;
};

export default function SwipeableOverlay({
  items,
  selectedIndex,
  onClose,
  onNavigate,
  onUpdate,
  onDelete,
  allTags,
  onTagsChange,
  onNewTagCreated,
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // État pour le contenu éditable (doc)
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentValue, setContentValue] = useState(currentItem?.content || "");

  // États pour l'éditeur d'image
  const [editorMode, setEditorMode] = useState<"crop" | "rotate" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronisation quand l'item change
  useEffect(() => {
    if (currentItem) {
      setTitleValue(currentItem.title);
      setObsValue(currentItem.observation || "");
      setContentValue(currentItem.content || "");
      setIsEditingTitle(false);
      setIsEditingObs(false);
      setIsEditingContent(false);
      setShowDeleteConfirm(false);
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
      if (isEditingTitle || isEditingObs || isEditingContent) {
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
  }, [goNext, goPrev, onClose, isEditingTitle, isEditingObs, isEditingContent]);

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

  const saveContent = async () => {
    setIsEditingContent(false);
    if (contentValue !== currentItem?.content && currentItem) {
      try {
        await updateDriveContentAction(currentItem.id, contentValue);
        if (onUpdate) {
          onUpdate(currentItem.id, { content: contentValue });
        }
      } catch (error) {
        console.error("Erreur sauvegarde contenu:", error);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete && currentItem) {
      onDelete(currentItem.id, currentItem.image_path);
    }
  };

  // Fonction pour sauvegarder l'image éditée
  const handleSaveEditedImage = async (blob: Blob) => {
    if (!currentItem) return;

    setIsSaving(true);
    try {
      // Convertir le blob en base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        try {
          const result = await replaceImageAction(
            currentItem.id,
            currentItem.image_path,
            base64Data
          );

          if (result.success && result.newUrl && onUpdate) {
            onUpdate(currentItem.id, { image_url: result.newUrl } as Partial<MyDriveItem>);
          }

          setEditorMode(null);
          // Forcer le rechargement de la page pour voir la nouvelle image
          window.location.reload();
        } catch (error) {
          console.error("Erreur lors de la sauvegarde:", error);
          alert("Erreur lors de la sauvegarde de l'image");
        } finally {
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Erreur:", error);
      setIsSaving(false);
    }
  };

  const isDoc = currentItem?.doc_type === "doc";
  // Vérifier si c'est une image (pas un PDF, pas un doc)
  const isImage = currentItem && !isDoc && !isPdf(currentItem.image_url);

  if (!currentItem) return null;

  const downloadName = filenameFromUrl(currentItem.image_url, currentItem.id);

  // Afficher l'éditeur d'image si actif
  if (editorMode && isImage) {
    return (
      <ImageEditor
        imageUrl={currentItem.image_url}
        mode={editorMode}
        onSave={handleSaveEditedImage}
        onCancel={() => setEditorMode(null)}
      />
    );
  }

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
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {/* Bouton Supprimer */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 text-sm px-3 py-2 rounded-lg transition-colors"
          >
            Supprimer
          </button>
        )}
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white text-2xl p-2"
        >
          ✕
        </button>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div
            className="bg-neutral-900 rounded-xl p-6 max-w-sm mx-4 shadow-2xl border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Supprimer ce document ?
            </h3>
            <p className="text-neutral-400 text-sm mb-6">
              Cette action est irréversible. Le document sera définitivement supprimé.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout Mobile: Image centrée avec titre en bas */}
      <div className="md:hidden w-full h-full flex flex-col items-center justify-center p-2">
        <div className="relative w-full h-full flex items-center justify-center">
          {isDoc ? (
            <div
              className="w-full max-w-sm bg-neutral-900 rounded-xl p-6 max-h-[80dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">{currentItem.title}</h2>
              <div className="text-gray-300 whitespace-pre-wrap text-sm">
                {currentItem.content || <span className="italic opacity-50">Aucun contenu</span>}
              </div>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentItem.image_url}
                alt={currentItem.title}
                className={`max-w-full max-h-[85dvh] object-contain rounded shadow-2xl select-none ${isPdf(currentItem.image_url) ? 'bg-white' : ''}`}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            </>
          )}
        </div>
        {!isDoc && (
          <div className="absolute bottom-8 text-white text-center px-4 max-w-2xl">
            <h2 className="text-lg font-semibold mb-3">{currentItem.title}</h2>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {isImage && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorMode("crop");
                    }}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors"
                  >
                    Rogner
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorMode("rotate");
                    }}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors"
                  >
                    Pivoter
                  </button>
                </>
              )}
              <a
                href={currentItem.image_url}
                download={downloadName}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-neutral-200 bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-sm backdrop-blur hover:bg-white transition-colors"
              >
                Télécharger
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Layout Desktop/Tablet: Split View */}
      <div className="hidden md:flex w-full h-full">
        {/* Moitié gauche - Image ou Document preview */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center relative p-4">
          {/* Flèche Gauche */}
          {selectedIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors z-10"
            >
              ←
            </button>
          )}

          {isDoc ? (
            <div
              className="w-full max-w-md bg-neutral-900 rounded-xl p-6 max-h-[75vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-16 h-16 text-neutral-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {currentItem.content || <span className="italic opacity-50">Aucun contenu</span>}
              </div>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentItem.image_url}
                alt={currentItem.title}
                className={`max-w-full max-h-[75vh] object-contain rounded shadow-2xl select-none ${isPdf(currentItem.image_url) ? 'bg-white' : ''}`}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />

              {/* Boutons d'édition sous l'image (seulement pour les images) */}
              {isImage && (
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorMode("crop");
                    }}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors"
                  >
                    Rogner
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorMode("rotate");
                    }}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors"
                  >
                    Pivoter
                  </button>
                </div>
              )}
            </>
          )}

          {/* Flèche Droite */}
          {selectedIndex < items.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors z-10"
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

          {/* Section Contenu éditable (pour les docs) */}
          {currentItem.doc_type === "doc" && (
            <div className="border-t border-neutral-800 pt-6 mb-6">
              <label className="block text-sm text-neutral-400 mb-3 uppercase tracking-wide">
                Contenu
              </label>
              {isEditingContent ? (
                <textarea
                  value={contentValue}
                  onChange={(e) => setContentValue(e.target.value)}
                  onBlur={saveContent}
                  autoFocus
                  rows={12}
                  className="w-full bg-neutral-900 text-gray-200 border border-blue-500 rounded-lg p-4 outline-none resize-y font-mono text-sm"
                  placeholder="Rédigez votre document..."
                />
              ) : (
                <div
                  onClick={() => setIsEditingContent(true)}
                  className="text-gray-300 cursor-text hover:text-white transition-colors min-h-[200px] whitespace-pre-wrap bg-neutral-900/50 rounded-lg p-4 border border-neutral-800 hover:border-neutral-600"
                  title="Cliquer pour modifier"
                >
                  {contentValue || (
                    <span className="italic opacity-50">
                      Cliquer pour rédiger le contenu du document...
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section Tags */}
          <div className="border-t border-neutral-800 pt-6">
            <label className="block text-sm text-neutral-400 mb-3 uppercase tracking-wide">
              Mots-clés
            </label>
            <TagSelector
              itemId={currentItem.id}
              itemTags={currentItem.tags || []}
              allTags={allTags}
              onTagsChange={onTagsChange}
              onNewTagCreated={onNewTagCreated}
            />
          </div>

          {/* Métadonnées et Téléchargement */}
          <div className="mt-auto pt-6 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-neutral-500 space-y-1">
                <p>ID: <span className="font-mono">{currentItem.id.slice(0, 8)}...</span></p>
                <p>Créé le: {new Date(currentItem.created_at).toLocaleDateString("fr-FR", {
                  dateStyle: "long",
                })}</p>
                {isDoc && <p className="text-blue-400">Document éditable</p>}
              </div>
              {!isDoc && currentItem.image_url && (
                <a
                  href={currentItem.image_url}
                  download={downloadName}
                  className="rounded-lg border border-neutral-200 bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-sm backdrop-blur hover:bg-white transition-colors"
                >
                  Télécharger
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
