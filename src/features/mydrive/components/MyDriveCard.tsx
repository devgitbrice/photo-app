"use client";

import { useEffect, useState } from "react";
import type { MyDriveItem } from "@/features/mydrive/types";

type Props = {
  item?: MyDriveItem; // 👈 défensif
  imageHeightClass: string;
  onOpen: (item: MyDriveItem) => void;
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

export default function MyDriveCard({
  item,
  imageHeightClass,
  onOpen,
}: Props) {
  // 🔒 Sécurité absolue
  if (!item) return null;

  const [formattedDate, setFormattedDate] = useState<string>("");

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

  return (
    <article className="rounded-2xl border overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.title}
          className={`w-full ${imageHeightClass} object-cover bg-black/5 cursor-zoom-in`}
          loading="lazy"
          onDoubleClick={() => onOpen(item)}
          title="Double-clic pour agrandir"
        />

        {/* Download */}
        <a
          href={item.image_url}
          download={downloadName}
          className="absolute right-2 top-2 rounded-xl border bg-white/90 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          Télécharger
        </a>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug line-clamp-2">
            {item.title}
          </h3>

          <span className="text-xs opacity-60 whitespace-nowrap">
            {formattedDate}
          </span>
        </div>

        <p className="text-sm opacity-80 line-clamp-3">
          {item.observation}
        </p>

        <div className="pt-2 text-xs opacity-60">
          ID:{" "}
          <span className="font-mono">
            {item.id.slice(0, 8)}…
          </span>
        </div>
      </div>
    </article>
  );
}
