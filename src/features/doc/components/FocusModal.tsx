import React, { useEffect, useRef } from "react";
import { DocBlock } from "../types";

interface FocusModalProps {
  block: DocBlock;
  onChange: (id: string, html: string) => void;
  onClose: () => void;
}

export default function FocusModal({ block, onChange, onClose }: FocusModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Écouteur pour la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Initialisation du contenu et focus automatique
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== block.html) {
      editorRef.current.innerHTML = block.html || "<p><br></p>";
      
      // Place le curseur à la fin du texte automatiquement
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editorRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(block.id, editorRef.current.innerHTML);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose} // Quitte si on clique sur le fond noir
    >
      {/* Empêche le clic dans la boîte de fermer la modale */}
      <div
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-xl p-8 shadow-2xl overflow-y-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-between items-center border-b border-neutral-800 pb-3">
          <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Mode Focus</span>
          <button onClick={onClose} className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded transition-colors">
            Échap pour quitter
          </button>
        </div>
        
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="w-full text-white text-lg leading-relaxed outline-none min-h-[50vh]
            [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-8
            [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:mt-6
            [&_h3]:text-2xl [&_h3]:font-medium [&_h3]:mb-3 [&_h3]:mt-5
            [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-400 [&_blockquote]:my-6
            [&_pre]:bg-neutral-950 [&_pre]:border [&_pre]:border-neutral-800 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-6"
        />
      </div>
    </div>
  );
}