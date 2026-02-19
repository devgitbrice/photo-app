import React from "react";
import { TocEntry } from "../types";
import { useThemeStore } from "@/store/themeStore";

interface TocSidebarProps {
  entries: TocEntry[];
  tocOpen: boolean;
}

export default function TocSidebar({ entries, tocOpen }: TocSidebarProps) {
  const light = useThemeStore((s) => s.theme) === "light";

  if (!tocOpen || entries.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className={`w-56 shrink-0 border-r overflow-y-auto ${light ? "border-neutral-300 bg-neutral-50" : "border-neutral-800 bg-neutral-900/50"}`}>
      <div className="p-3">
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Plan</div>
        <nav className="space-y-0.5">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => scrollToHeading(entry.id)}
              className={`block w-full text-left truncate rounded px-2 py-1 transition-colors ${
                light ? "hover:bg-neutral-200" : "hover:bg-neutral-800"
              } ${
                entry.level === 1
                  ? light ? "text-sm text-neutral-900 font-semibold" : "text-sm text-white font-semibold"
                  : entry.level === 2
                    ? light ? "text-sm text-neutral-600 pl-4" : "text-sm text-neutral-300 pl-4"
                    : light ? "text-xs text-neutral-500 pl-6" : "text-xs text-neutral-400 pl-6"
              }`}
              title={entry.text}
            >
              {entry.text}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
