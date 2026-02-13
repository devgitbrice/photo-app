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
    document.execCommand("defaultParagraphSeparator", false, "p");
    if (editorRef.current && editorRef.current.innerHTML !== block.html) {
      editorRef.current.innerHTML = block.html || "<p><br></p>";
    }
  }, [block.html]);

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
      if ((node as Element).tagName === 'A') return; // Ne pas toucher aux liens déjà existants
      const children = Array.from(node.childNodes);
      children.forEach(linkifyNode);
    }
  };

  const handleBlur = () => {
    if (editorRef.current) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editorRef.current.innerHTML;
      linkifyNode(tempDiv);
      
      const newHtml = tempDiv.innerHTML;
      if (newHtml !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = newHtml;
        onHtmlChange(block.id, newHtml);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey && onSplit) {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const marker = document.createElement("span");
      marker.id = `split-${Date.now()}`;
      range.insertNode(marker);
      const parts = editorRef.current?.innerHTML.split(marker.outerHTML) || [];
      marker.remove();
      if (parts.length === 2) onSplit(block.id, parts[0] || "<p><br></p>", parts[1] || "<p><br></p>");
    }
  };

  return (
    <div className="group relative w-full my-2 rounded-lg border border-transparent hover:border-neutral-700 transition-colors p-3">
      <div className="absolute -left-10 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button onClick={() => onFocusBlock(block.id)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-md"><Search size={16} /></button>
        <button onClick={() => onMoveUp?.(block.id)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-md"><ArrowUp size={16} /></button>
        <button onClick={() => onMoveDown?.(block.id)} className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-md"><ArrowDown size={16} /></button>
      </div>
      <div
        ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => onHtmlChange(block.id, editorRef.current?.innerHTML || "")}
        onBlur={handleBlur} onKeyDown={handleKeyDown}
        className="block-editor-content w-full text-white outline-none min-h-[1.5rem] whitespace-pre-wrap
          [&_h1]:text-3xl [&_h1]:font-bold [&_p]:mb-3 [&_pre]:bg-neutral-900 [&_pre]:p-4 [&_pre]:rounded-lg"
      />
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-10">
        <button onClick={() => onAddBelow(block.id)} className="p-1.5 bg-blue-600 text-white rounded-full shadow-lg"><Plus size={16} /></button>
      </div>
    </div>
  );
});