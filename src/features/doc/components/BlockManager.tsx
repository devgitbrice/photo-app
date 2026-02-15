import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { TocEntry } from "../types";
import { SingleBlock } from "./SingleBlock";
import FocusModal from "./FocusModal";
import TocSidebar from "./TocSidebar";
import { useBlocks, SEPARATOR } from "../hooks/useBlocks";

interface BlockManagerProps {
  initialHtml: string;
  tocOpen: boolean;
  onChange: (html: string) => void;
}

export default function BlockManager({ initialHtml, tocOpen, onChange }: BlockManagerProps) {
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const tocTimeout = useRef<NodeJS.Timeout | null>(null);
  const saveRef = useRef<() => void>(() => {});

  const {
    blocks, focusedBlockId, setFocusedBlockId, htmlRefs,
    handleHtmlChange, handleFocusChange, handleAddBelow,
    handleAddAtEnd, handleMoveUp, handleMoveDown, handleSplit
  } = useBlocks(initialHtml, () => saveRef.current());

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
    // On récupère le contenu qui peut désormais contenir des balises <a>
    blockDivs.forEach(div => updatedHtmls.push(div.innerHTML));

    const finalHtmls = updatedHtmls.length === blocks.length ? updatedHtmls : blocks.map(b => htmlRefs.current[b.id] || "");
    onChange(finalHtmls.join(SEPARATOR));
  }, [blocks.length, htmlRefs, onChange]);

  useEffect(() => {
    saveRef.current = () => {
      if (tocTimeout.current) clearTimeout(tocTimeout.current);
      tocTimeout.current = setTimeout(updateTocAndSave, 500);
    };
  }, [updateTocAndSave]);

  // Listen for chatbot insert events
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (!text) return;
      // Convert plain text to HTML paragraphs
      const html = text.split("\n").map((line: string) =>
        line.trim() ? `<p>${line}</p>` : "<p><br></p>"
      ).join("");
      // Add as a new block at the end
      handleAddAtEnd();
      // Set the content of the last block after a tick
      setTimeout(() => {
        const allBlocks = document.querySelectorAll('.block-editor-content');
        const lastBlock = allBlocks[allBlocks.length - 1];
        if (lastBlock) {
          lastBlock.innerHTML = html;
          // Trigger save
          saveRef.current();
        }
      }, 100);
    };
    window.addEventListener("chatbot-insert", handler);
    return () => window.removeEventListener("chatbot-insert", handler);
  }, [handleAddAtEnd]);

  const focusedBlock = focusedBlockId ? { id: focusedBlockId, html: htmlRefs.current[focusedBlockId] || "" } : null;

  return (
    <div className="flex-1 overflow-hidden flex bg-neutral-950 w-full min-w-0">
      <TocSidebar entries={tocEntries} tocOpen={tocOpen} />
      <div className="flex-1 overflow-y-auto w-full min-w-0">
        <div className="max-w-4xl mx-auto p-6 pb-32 w-full">
          {blocks.map((block) => (
            <SingleBlock 
              key={block.id} 
              block={block} 
              onHtmlChange={handleHtmlChange} 
              onAddBelow={handleAddBelow} 
              onFocusBlock={setFocusedBlockId} 
              onMoveUp={handleMoveUp} 
              onMoveDown={handleMoveDown} 
              onSplit={handleSplit} 
            />
          ))}
          <div className="mt-8 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={handleAddAtEnd} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-full transition-colors border border-neutral-700">
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