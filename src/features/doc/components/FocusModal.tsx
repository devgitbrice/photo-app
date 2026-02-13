import React, { useEffect, useRef } from "react";
import { DocBlock } from "../types";

interface FocusModalProps {
  block: DocBlock;
  onChange: (id: string, html: string) => void;
  onClose: () => void;
}

export default function FocusModal({ block, onChange, onClose }: FocusModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== block.html) {
      editorRef.current.innerHTML = block.html || "<p><br></p>";
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editorRef.current.focus();
    }
  }, []);

  const linkifyNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9.-]+\.[a-z]{2,10}[^\s<]*)/gi;
      const text = node.textContent || "";
      if (urlRegex.test(text)) {
        const span = document.createElement("span");
        span.innerHTML = text.replace(urlRegex, (url) => {
          const href = url.startsWith("http") ? url : `https://${url}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${url}</a>`;
        });
        node.parentNode?.replaceChild(span, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as Element).tagName === 'A') return;
      Array.from(node.childNodes).forEach(linkifyNode);
    }
  };

  const handleBlur = () => {
    if (editorRef.current) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editorRef.current.innerHTML;
      linkifyNode(tempDiv);
      if (tempDiv.innerHTML !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = tempDiv.innerHTML;
        onChange(block.id, tempDiv.innerHTML);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-xl p-8 shadow-2xl overflow-y-auto max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex justify-between items-center border-b border-neutral-800 pb-3">
          <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Mode Focus</span>
          <button onClick={onClose} className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded transition-colors">Échap pour quitter</button>
        </div>
        <div
          ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={() => onChange(block.id, editorRef.current?.innerHTML || "")}
          onBlur={handleBlur}
          className="w-full text-white text-lg leading-relaxed outline-none min-h-[50vh]
            [&_a]:text-blue-400 [&_a]:underline
            [&_h1]:text-4xl [&_h1]:font-bold [&_p]:mb-4 [&_pre]:bg-neutral-950 [&_pre]:p-4 [&_pre]:rounded-lg"
        />
      </div>
    </div>
  );
}