"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useNewItemStore } from "@/store/newItemStore";

export default function AddButtonWithCamera() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const setPhoto = useNewItemStore((s) => s.setPhoto);

  const openCamera = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Input "visually hidden" (pas display:none) pour compatibilité mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (!file) return;

          setPhoto(file);

          // reset pour pouvoir reprendre la même photo
          e.currentTarget.value = "";

          router.push("/add");
        }}
      />

      <button
        type="button"
        onClick={openCamera}
        className="w-full rounded-2xl px-6 py-5 text-lg font-semibold shadow-sm border"
      >
        AJOUTER
      </button>
    </div>
  );
}
