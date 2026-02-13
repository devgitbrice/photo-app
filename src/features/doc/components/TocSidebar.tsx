import React from "react";
import { TocEntry } from "../types";

interface TocSidebarProps {
  entries: TocEntry[];
  tocOpen: boolean;
}

export default function TocSidebar({ entries, tocOpen }: TocSidebarProps) {
  if (!tocOpen || entries.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-900/50 overflow-y-auto">
      <div className="p-3">
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Plan</div>
        <nav className="space-y-0.5">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => scrollToHeading(entry.id)}
              className={`block w-full text-left truncate rounded px-2 py-1 hover:bg-neutral-800 transition-colors ${
                entry.level === 1
                  ? "text-sm text-white font-semibold"
                  : entry.level === 2
                    ? "text-sm text-neutral-300 pl-4"
                    : "text-xs text-neutral-400 pl-6"
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