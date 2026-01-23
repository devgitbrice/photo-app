"use client";

import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";

export default function AddPage() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Ajouter</h1>
          <p className="text-sm opacity-80">
            Prends une photo. On passera ensuite à la description et au titre.
          </p>
        </header>

        <CameraCapture value={file} onChange={setFile} />

        <button
          type="button"
          disabled={!file}
          className="w-full rounded-2xl px-6 py-4 font-semibold shadow-sm border disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            // Next step: upload Supabase + écran description
            // (on le fera juste après, proprement)
            alert("OK — prochaine étape: upload Supabase puis description.");
          }}
        >
          Continuer
        </button>
      </div>
    </main>
  );
}
