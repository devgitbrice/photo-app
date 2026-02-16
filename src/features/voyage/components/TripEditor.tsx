"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { MyDriveItem } from "@/features/mydrive/types";
import { updateDriveContentAction } from "@/features/mydrive/modify";
import { searchDriveItemsAction } from "@/features/mydrive/modify";
import { getEditUrl } from "@/components/FileSearchModal";
import type { TripData, Trajet, Logement, AttachedFile } from "@/features/voyage/types";
import {
  TRANSPORT_MODES,
  createEmptyTrajet,
  createEmptyLogement,
  createEmptyTripData,
  calculateNights,
  calculateTripTotals,
} from "@/features/voyage/types";

// ------------------------------------------------------------------
// Petit composant de recherche de fichier inline
// ------------------------------------------------------------------
function FileSearchInline({
  onSelect,
  onClose,
}: {
  onSelect: (file: AttachedFile) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchDriveItemsAction(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (val.trim().length >= 3) {
      setLoading(true);
      timeoutRef.current = setTimeout(() => doSearch(val), 300);
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-700">
        <svg
          className="w-4 h-4 text-neutral-500 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder="Rechercher un fichier (3 lettres min.)..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-500"
        />
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white text-xs"
        >
          ESC
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {loading && (
          <div className="px-3 py-3 text-neutral-500 text-xs text-center">
            Recherche...
          </div>
        )}
        {!loading && query.trim().length >= 3 && results.length === 0 && (
          <div className="px-3 py-3 text-neutral-500 text-xs text-center">
            Aucun fichier trouve
          </div>
        )}
        {!loading &&
          results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect({
                  id: item.id,
                  title: item.title,
                  doc_type: item.doc_type,
                });
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors flex items-center gap-2"
            >
              <span className="text-[10px] font-bold uppercase text-neutral-500 w-14 shrink-0">
                {item.doc_type || "Fichier"}
              </span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Fichier attache affiche
// ------------------------------------------------------------------
function AttachedFileChip({
  file,
  onRemove,
}: {
  file: AttachedFile;
  onRemove: () => void;
}) {
  const url = getEditUrl({
    id: file.id,
    title: file.title,
    doc_type: file.doc_type,
    type: "file",
  });

  return (
    <span className="inline-flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-300">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-sky-400 transition-colors truncate max-w-[150px]"
      >
        {file.title}
      </a>
      <button
        onClick={onRemove}
        className="text-neutral-500 hover:text-red-400 transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </span>
  );
}

// ------------------------------------------------------------------
// Ligne Trajet editable
// ------------------------------------------------------------------
function TrajetRow({
  trajet,
  onChange,
  onRemove,
}: {
  trajet: Trajet;
  onChange: (updated: Trajet) => void;
  onRemove: () => void;
}) {
  const [fileSearchOpen, setFileSearchOpen] = useState(false);

  const update = (fields: Partial<Trajet>) => {
    const next = { ...trajet, ...fields };
    // Recalculer le total
    next.totalPrice = next.numberOfPeople * next.unitPrice;
    onChange(next);
  };

  const addFile = (file: AttachedFile) => {
    if (trajet.attachedFiles.some((f) => f.id === file.id)) return;
    onChange({ ...trajet, attachedFiles: [...trajet.attachedFiles, file] });
  };

  const removeFile = (fileId: string) => {
    onChange({
      ...trajet,
      attachedFiles: trajet.attachedFiles.filter((f) => f.id !== fileId),
    });
  };

  const inputCls =
    "bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-sky-500 transition-colors";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-sky-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <span className="text-sm font-semibold text-sky-400">Trajet</span>
        </div>
        <button
          onClick={onRemove}
          className="text-neutral-500 hover:text-red-400 transition-colors"
          title="Supprimer ce trajet"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Depart */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Point de depart"
          value={trajet.departurePoint}
          onChange={(e) => update({ departurePoint: e.target.value })}
          className={inputCls}
        />
        <input
          type="date"
          value={trajet.departureDate}
          onChange={(e) => update({ departureDate: e.target.value })}
          className={inputCls}
        />
        <input
          type="time"
          value={trajet.departureTime}
          onChange={(e) => update({ departureTime: e.target.value })}
          className={inputCls}
        />
      </div>

      {/* Arrivee */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Point d'arrivee"
          value={trajet.arrivalPoint}
          onChange={(e) => update({ arrivalPoint: e.target.value })}
          className={inputCls}
        />
        <input
          type="date"
          value={trajet.arrivalDate}
          onChange={(e) => update({ arrivalDate: e.target.value })}
          className={inputCls}
        />
        <input
          type="time"
          value={trajet.arrivalTime}
          onChange={(e) => update({ arrivalTime: e.target.value })}
          className={inputCls}
        />
      </div>

      {/* Transport, personnes, prix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select
          value={trajet.transportMode}
          onChange={(e) => update({ transportMode: e.target.value })}
          className={inputCls + " cursor-pointer"}
        >
          {TRANSPORT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          placeholder="Personnes"
          value={trajet.numberOfPeople || ""}
          onChange={(e) =>
            update({ numberOfPeople: Math.max(1, Number(e.target.value) || 1) })
          }
          className={inputCls}
        />
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder="Prix unitaire"
          value={trajet.unitPrice || ""}
          onChange={(e) =>
            update({ unitPrice: Math.max(0, Number(e.target.value) || 0) })
          }
          className={inputCls}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-400 whitespace-nowrap">
            Total:{" "}
            <span className="text-white font-semibold">
              {trajet.totalPrice.toFixed(2)} &euro;
            </span>
          </span>
        </div>
      </div>

      {/* Paye + fichiers */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={trajet.isPaid}
            onChange={(e) => update({ isPaid: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-600 text-sky-500 focus:ring-sky-500 bg-neutral-800"
          />
          <span
            className={`text-sm ${trajet.isPaid ? "text-green-400" : "text-neutral-400"}`}
          >
            {trajet.isPaid ? "Paye" : "Non paye"}
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {trajet.attachedFiles.map((f) => (
            <AttachedFileChip
              key={f.id}
              file={f}
              onRemove={() => removeFile(f.id)}
            />
          ))}
          <button
            onClick={() => setFileSearchOpen(!fileSearchOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Fichier
          </button>
        </div>
      </div>

      {fileSearchOpen && (
        <FileSearchInline
          onSelect={addFile}
          onClose={() => setFileSearchOpen(false)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Ligne Logement editable
// ------------------------------------------------------------------
function LogementRow({
  logement,
  onChange,
  onRemove,
}: {
  logement: Logement;
  onChange: (updated: Logement) => void;
  onRemove: () => void;
}) {
  const [fileSearchOpen, setFileSearchOpen] = useState(false);

  const update = (fields: Partial<Logement>) => {
    const next = { ...logement, ...fields };
    // Recalculer le total
    const nights = calculateNights(next.arrivalDate, next.departureDate);
    next.totalPrice = nights * next.pricePerDay;
    onChange(next);
  };

  const addFile = (file: AttachedFile) => {
    if (logement.attachedFiles.some((f) => f.id === file.id)) return;
    onChange({
      ...logement,
      attachedFiles: [...logement.attachedFiles, file],
    });
  };

  const removeFile = (fileId: string) => {
    onChange({
      ...logement,
      attachedFiles: logement.attachedFiles.filter((f) => f.id !== fileId),
    });
  };

  const nights = calculateNights(logement.arrivalDate, logement.departureDate);

  const inputCls =
    "bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-sky-500 transition-colors";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
            />
          </svg>
          <span className="text-sm font-semibold text-amber-400">
            Logement
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-neutral-500 hover:text-red-400 transition-colors"
          title="Supprimer ce logement"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Ville, lieu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Ville"
          value={logement.city}
          onChange={(e) => update({ city: e.target.value })}
          className={inputCls}
        />
        <input
          type="text"
          placeholder="Lieu / nom de l'hebergement"
          value={logement.place}
          onChange={(e) => update({ place: e.target.value })}
          className={inputCls}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1 block">
            Date d&apos;arrivee
          </label>
          <input
            type="date"
            value={logement.arrivalDate}
            onChange={(e) => update({ arrivalDate: e.target.value })}
            className={inputCls + " w-full"}
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1 block">
            Date de depart
          </label>
          <input
            type="date"
            value={logement.departureDate}
            onChange={(e) => update({ departureDate: e.target.value })}
            className={inputCls + " w-full"}
          />
        </div>
      </div>

      {/* Prix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder="Prix / jour"
          value={logement.pricePerDay || ""}
          onChange={(e) =>
            update({ pricePerDay: Math.max(0, Number(e.target.value) || 0) })
          }
          className={inputCls}
        />
        <span className="text-sm text-neutral-400">
          {nights} nuit{nights !== 1 ? "s" : ""}
        </span>
        <span className="text-sm text-neutral-400">
          Total:{" "}
          <span className="text-white font-semibold">
            {logement.totalPrice.toFixed(2)} &euro;
          </span>
        </span>
      </div>

      {/* Paye + fichiers */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={logement.isPaid}
            onChange={(e) => update({ isPaid: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-600 text-sky-500 focus:ring-sky-500 bg-neutral-800"
          />
          <span
            className={`text-sm ${logement.isPaid ? "text-green-400" : "text-neutral-400"}`}
          >
            {logement.isPaid ? "Paye" : "Non paye"}
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {logement.attachedFiles.map((f) => (
            <AttachedFileChip
              key={f.id}
              file={f}
              onRemove={() => removeFile(f.id)}
            />
          ))}
          <button
            onClick={() => setFileSearchOpen(!fileSearchOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Fichier
          </button>
        </div>
      </div>

      {fileSearchOpen && (
        <FileSearchInline
          onSelect={addFile}
          onClose={() => setFileSearchOpen(false)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Composant principal TripEditor
// ------------------------------------------------------------------
export default function TripEditor({ item }: { item: MyDriveItem }) {
  const [data, setData] = useState<TripData>(() => {
    try {
      const parsed = JSON.parse(item.content || "{}");
      return {
        trajets: parsed.trajets || [],
        logements: parsed.logements || [],
      };
    } catch {
      return createEmptyTripData();
    }
  });

  const [saving, setSaving] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save with debounce
  const save = useCallback(
    (newData: TripData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await updateDriveContentAction(item.id, JSON.stringify(newData));
        } catch (err) {
          console.error("Erreur sauvegarde voyage:", err);
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [item.id]
  );

  const updateData = (newData: TripData) => {
    setData(newData);
    save(newData);
  };

  // --- Trajet handlers ---
  const addTrajet = () => {
    updateData({ ...data, trajets: [...data.trajets, createEmptyTrajet()] });
    setAddMenuOpen(false);
  };

  const updateTrajet = (id: string, updated: Trajet) => {
    updateData({
      ...data,
      trajets: data.trajets.map((t) => (t.id === id ? updated : t)),
    });
  };

  const removeTrajet = (id: string) => {
    updateData({
      ...data,
      trajets: data.trajets.filter((t) => t.id !== id),
    });
  };

  // --- Logement handlers ---
  const addLogement = () => {
    updateData({
      ...data,
      logements: [...data.logements, createEmptyLogement()],
    });
    setAddMenuOpen(false);
  };

  const updateLogement = (id: string, updated: Logement) => {
    updateData({
      ...data,
      logements: data.logements.map((l) => (l.id === id ? updated : l)),
    });
  };

  const removeLogement = (id: string) => {
    updateData({
      ...data,
      logements: data.logements.filter((l) => l.id !== id),
    });
  };

  // --- Totaux ---
  const totals = calculateTripTotals(data);

  // Merge all items by order of creation (alternating trajets + logements)
  // We keep them in their separate arrays for simplicity but display interleaved
  const allItems: { type: "trajet" | "logement"; id: string }[] = [
    ...data.trajets.map((t) => ({ type: "trajet" as const, id: t.id })),
    ...data.logements.map((l) => ({ type: "logement" as const, id: l.id })),
  ];

  return (
    <div className="min-h-dvh p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/mydrive"
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              {item.title}
            </h1>
            <span className="text-xs text-sky-400 uppercase tracking-wider font-bold">
              Voyage
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {saving && (
            <span className="text-sky-400 animate-pulse">Sauvegarde...</span>
          )}
          {!saving && (
            <span className="text-green-500">Sauvegarde auto</span>
          )}
        </div>
      </header>

      {/* Bandeau recapitulatif */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            Total
          </div>
          <div className="text-lg font-bold text-white">
            {totals.total.toFixed(2)} &euro;
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            Deja paye
          </div>
          <div className="text-lg font-bold text-green-400">
            {totals.paid.toFixed(2)} &euro;
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            Reste a payer
          </div>
          <div className="text-lg font-bold text-amber-400">
            {totals.remaining.toFixed(2)} &euro;
          </div>
        </div>
      </div>

      {/* Bouton Ajouter */}
      <div className="relative">
        <button
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Ajouter
        </button>

        {addMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setAddMenuOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden min-w-[200px]">
              <button
                onClick={addTrajet}
                className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-3"
              >
                <svg
                  className="w-4 h-4 text-sky-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Trajet
              </button>
              <button
                onClick={addLogement}
                className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-3 border-t border-neutral-800"
              >
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
                  />
                </svg>
                Logement
              </button>
            </div>
          </>
        )}
      </div>

      {/* Liste des elements */}
      <div className="space-y-4">
        {data.trajets.length === 0 && data.logements.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l-7-7 3-3 4 4 8-8 3 3-11 11z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z"
              />
            </svg>
            <p>
              Aucun element pour ce voyage. Cliquez sur{" "}
              <strong>Ajouter</strong> pour commencer.
            </p>
          </div>
        )}

        {/* Trajets */}
        {data.trajets.map((t) => (
          <TrajetRow
            key={t.id}
            trajet={t}
            onChange={(updated) => updateTrajet(t.id, updated)}
            onRemove={() => removeTrajet(t.id)}
          />
        ))}

        {/* Logements */}
        {data.logements.map((l) => (
          <LogementRow
            key={l.id}
            logement={l}
            onChange={(updated) => updateLogement(l.id, updated)}
            onRemove={() => removeLogement(l.id)}
          />
        ))}
      </div>
    </div>
  );
}
