import React, { useRef, useEffect, memo } from "react";
import { Search, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { DocBlock } from "../types";

interface SingleBlockProps {
  block: DocBlock;
  onHtmlChange: (id: string, html: string) => void;
  onAddBelow: (id: string) => void;
  onFocusBlock: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onSplit?: (id: string, beforeHtml: string, afterHtml: string) => void;
}

export const SingleBlock = memo(function SingleBlock({ 
  block, onHtmlChange, onAddBelow, onFocusBlock, onMoveUp, onMoveDown, onSplit 
}: SingleBlockProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force le navigateur à créer de vrais paragraphes pour éviter le texte aplati
    document.execCommand("defaultParagraphSeparator", false, "p");
    
    if (editorRef.current && editorRef.current.innerHTML !== block.html) {
      editorRef.current.innerHTML = block.html || "<p><br></p>";
    }
  }, [block.html]);

  const handleInput = () => {
    if (editorRef.current) {
      onHtmlChange(block.id, editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Si on fait Entrée (sans majuscule pour Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey && onSplit) {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const markerId = `split-marker-${Date.now()}`;
      const markerNode = document.createElement("span");
      markerNode.id = markerId;

      // Insère un marqueur invisible là où est le curseur
      range.insertNode(markerNode);
      const fullHtml = editorRef.current?.innerHTML || "";
      // On le retire tout de suite pour ne pas polluer le DOM
      markerNode.remove(); 

      // On coupe le HTML autour de ce marqueur
      const parts = fullHtml.split(`<span id="${markerId}"></span>`);
      if (parts.length === 2) {
        const before = parts[0] || "<p><br></p>";
        const after = parts[1] || "<p><br></p>";
        onSplit(block.id, before, after);
      }
    }
  };

  return (
    <div className="group relative w-full my-2 rounded-lg border border-transparent hover:border-neutral-700 transition-colors p-3">
      <div className="absolute -left-10 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button onClick={() => onFocusBlock(block.id)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-md shadow-sm" title="Zoomer sur ce bloc">
          <Search size={16} />
        </button>
        <button onClick={() => onMoveUp?.(block.id)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-md shadow-sm" title="Monter le bloc">
          <ArrowUp size={16} />
        </button>
        <button onClick={() => onMoveDown?.(block.id)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-md shadow-sm" title="Descendre le bloc">
          <ArrowDown size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="block-editor-content w-full min-w-0 text-white text-base leading-relaxed outline-none min-h-[1.5rem] whitespace-pre-wrap
          [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
          [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5
          [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
          [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
          [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-400 [&_blockquote]:my-4
          [&_pre]:bg-neutral-900 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4"
      />

      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => onAddBelow(block.id)} className="p-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-full shadow-lg" title="Ajouter un bloc en dessous">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
});