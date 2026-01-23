"use client";

import { useEffect, useMemo } from "react";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
};

export default function CameraCapture({ value, onChange }: Props) {
  const previewUrl = useMemo(() => {
    if (!value) return null;
    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <section className="space-y-3">
      <label className="block text-sm font-medium">Photo</label>

      <div className="rounded-2xl border p-4 space-y-3">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onChange(f);
          }}
        />

        {previewUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Prévisualisation"
              className="w-full rounded-2xl border"
            />
            <button
              type="button"
              className="w-full rounded-2xl px-4 py-3 font-semibold border"
              onClick={() => onChange(null)}
            >
              Retirer la photo
            </button>
          </div>
        ) : (
          <p className="text-sm opacity-70">
            Sur mobile, cela ouvre l’appareil photo. Sur desktop, ça ouvre un sélecteur de fichiers.
          </p>
        )}
      </div>
    </section>
  );
}
