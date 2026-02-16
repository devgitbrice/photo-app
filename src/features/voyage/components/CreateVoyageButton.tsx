"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVoyageAction } from "@/features/mydrive/modify";

export default function CreateVoyageButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const result = await createVoyageAction(trimmed);
      if (!result.success) {
        alert("Erreur Supabase: " + result.error);
        return;
      }
      setOpen(false);
      setTitle("");
      router.push(`/editvoyage/${result.id}`);
    } catch (err: any) {
      console.error("Erreur creation voyage:", err);
      alert("Erreur: " + (err?.message || "Erreur inconnue lors de la creation du voyage."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl px-4 py-2 text-sm font-semibold border border-sky-600 text-sky-400 hover:bg-sky-600 hover:text-white transition-colors"
      >
        Voyage
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => { setOpen(false); setTitle(""); }}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Nouveau Voyage
            </h3>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setOpen(false); setTitle(""); }
              }}
              placeholder="Titre du voyage..."
              className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-2.5 outline-none focus:border-sky-500 text-sm mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setOpen(false); setTitle(""); }}
                className="px-4 py-2 text-sm text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || loading}
                className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creation..." : "Creer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
