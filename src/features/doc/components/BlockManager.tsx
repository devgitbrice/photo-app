import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import { DocBlock, TocEntry } from "../types";
import { SingleBlock } from "./SingleBlock";
import FocusModal from "./FocusModal";
import TocSidebar from "./TocSidebar";

interface BlockManagerProps {
  initialHtml: string;
  tocOpen: boolean;
  onChange: (html: string) => void;
}

// Séparateur pare-balles pour la base de données
const SEPARATOR = "||BLOCK||";

// Astuce pour éviter le crash du compilateur Next.js avec les anciens documents
const OLD_SEP = "<" + "!--BLOCK_SEPARATOR--" + ">";

// Restaure les paragraphes si la base de données a renvoyé du texte brut
function ensureHtml(raw: string): string {
  if (!raw || !raw.trim()) return "<p><br></p>";
  if (/<[a-z][\s\S]*?>/i.test(raw)) return raw;
  return raw.split("\n").map(line => (line.trim() ? `<p>${line}</p>` : "<p><br></p>")).join("");
}

export default function BlockManager({ initialHtml, tocOpen, onChange }: BlockManagerProps) {
  const [blocks, setBlocks] = useState<DocBlock[]>(() => {
    if (!initialHtml) return [{ id: crypto.randomUUID(), html: "<p><br></p>" }];
    
    // Remplacement 100% sécurisé sans Regex
    const safeHtml = initialHtml.split(OLD_SEP).join(SEPARATOR);
    
    if (safeHtml.includes(SEPARATOR)) {
      return safeHtml.split(SEPARATOR).map(h => ({ id: crypto.randomUUID(), html: ensureHtml(h) }));
    }
    return [{ id: crypto.randomUUID(), html: ensureHtml(safeHtml) }];
  });

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const htmlRefs = useRef<{ [id: string]: string }>({});
  const tocTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    blocks.forEach(b => { if (htmlRefs.current[b.id] === undefined) htmlRefs.current[b.id] = b.html; });
  }, [blocks]);

  const updateTocAndSave = useCallback(() => {
    const headings = document.querySelectorAll('.block-editor-content h1, .block-editor-content h2, .block-editor-content h3');
    const entries: TocEntry[] = [];
    headings.forEach((el, i) => {
      const id = `toc-${i}`;
      el.id = id;
      if (el.textContent?.trim()) entries.push({ id, text: el.textContent.trim(), level: parseInt(el.tagName[1]) });
    });
    setTocEntries(entries);

    const blockDivs = document.querySelectorAll('.block-editor-content');
    const updatedHtmls: string[] = [];
    blockDivs.forEach(div => updatedHtmls.push(div.innerHTML));

    const finalHtmls = updatedHtmls.length === blocks.length ? updatedHtmls : blocks.map(b => htmlRefs.current[b.id] || "");
    onChange(finalHtmls.join(SEPARATOR));
  }, [blocks.length, onChange]);

  const handleHtmlChange = useCallback((id: string, newHtml: string) => {
    htmlRefs.current[id] = newHtml;
    if (tocTimeout.current) clearTimeout(tocTimeout.current);
    tocTimeout.current = setTimeout(updateTocAndSave, 500);
  }, [updateTocAndSave]);

  const handleFocusChange = useCallback((id: string, html: string) => {
    htmlRefs.current[id] = html;
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, html } : b));
    if (tocTimeout.current) clearTimeout(tocTimeout.current);
    tocTimeout.current = setTimeout(updateTocAndSave, 500);
  }, [updateTocAndSave]);

  const handleAddBelow = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const nb = { id: crypto.randomUUID(), html: "<p><br></p>" };
      htmlRefs.current[nb.id] = nb.html;
      const arr = [...prev];
      arr.splice(idx + 1, 0, nb);
      return arr;
    });
    setTimeout(updateTocAndSave, 100);
  }, [updateTocAndSave]);

  const handleAddAtEnd = useCallback(() => {
    setBlocks(prev => {
      const nb = { id: crypto.randomUUID(), html: "<p><br></p>" };
      htmlRefs.current[nb.id] = nb.html;
      return [...prev, nb];
    });
    setTimeout(updateTocAndSave, 100);
  }, [updateTocAndSave]);

  const focusedBlock = focusedBlockId ? { id: focusedBlockId, html: htmlRefs.current[focusedBlockId] || "" } : null;

  return (
    <div className="flex-1 overflow-hidden flex bg-neutral-950 w-full min-w-0">
      <TocSidebar entries={tocEntries} tocOpen={tocOpen} />
      <div className="flex-1 overflow-y-auto w-full min-w-0">
        <div className="max-w-4xl mx-auto p-6 pb-32 w-full">
          {blocks.map((block) => (
            <SingleBlock key={block.id} block={block} onHtmlChange={handleHtmlChange} onAddBelow={handleAddBelow} onFocusBlock={setFocusedBlockId} />
          ))}
          <div className="mt-8 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={handleAddAtEnd} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-full transition-colors border border-neutral-700 shadow-sm">
              <Plus size={20} />
              <span className="text-sm font-medium">Ajouter un bloc</span>
            </button>
          </div>
          {focusedBlock && (
            <FocusModal block={focusedBlock} onChange={handleFocusChange} onClose={() => setFocusedBlockId(null)} />
          )}
        </div>
      </div>
    </div>
  );
}