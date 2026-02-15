import React, { useRef, useEffect, useCallback, memo } from "react";
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

/** Remove injected copy buttons from HTML before saving */
function stripCopyButtons(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll(".code-copy-btn").forEach((btn) => btn.remove());
  return div.innerHTML;
}

export const SingleBlock = memo(function SingleBlock({
  block, onHtmlChange, onAddBelow, onFocusBlock, onMoveUp, onMoveDown, onSplit
}: SingleBlockProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  /** Inject copy buttons into <pre> elements */
  const injectCopyButtons = useCallback(() => {
    if (!editorRef.current) return;
    const pres = editorRef.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.contentEditable = "false";
      btn.textContent = "Copier";
      btn.style.cssText =
        "position:absolute;top:8px;right:8px;padding:4px 12px;font-size:11px;font-family:system-ui,sans-serif;" +
        "background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;" +
        "opacity:0;transition:opacity .2s;z-index:5;font-weight:500;letter-spacing:0.02em;";
      btn.addEventListener("mouseenter", () => { btn.style.opacity = "1"; btn.style.background = "#2563eb"; });
      btn.addEventListener("mouseleave", () => { btn.style.opacity = "0"; btn.style.background = "#3b82f6"; });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const clone = pre.cloneNode(true) as HTMLPreElement;
        clone.querySelector(".code-copy-btn")?.remove();
        const text = clone.textContent?.trim() || "";
        navigator.clipboard.writeText(text);
        btn.textContent = "Copié !";
        btn.style.background = "#22c55e";
        setTimeout(() => { btn.textContent = "Copier"; btn.style.background = "#3b82f6"; }, 2000);
      });
      // Show button on pre hover
      pre.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
      pre.addEventListener("mouseleave", (e) => {
        const related = e.relatedTarget as HTMLElement | null;
        if (related !== btn && !btn.contains(related)) btn.style.opacity = "0";
      });
      pre.appendChild(btn);
    });
  }, []);

  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
    if (editorRef.current && editorRef.current.innerHTML !== block.html) {
      editorRef.current.innerHTML = block.html || "<p><br></p>";
    }
    injectCopyButtons();
  }, [block.html, injectCopyButtons]);

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

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = stripCopyButtons(editorRef.current.innerHTML);
    onHtmlChange(block.id, html);
    // Re-inject copy buttons after DOM change
    setTimeout(injectCopyButtons, 0);
  };

  const handleBlur = () => {
    if (editorRef.current) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = stripCopyButtons(editorRef.current.innerHTML);
      linkifyNode(tempDiv);

      const newHtml = tempDiv.innerHTML;
      const currentClean = stripCopyButtons(editorRef.current.innerHTML);
      if (newHtml !== currentClean) {
        editorRef.current.innerHTML = newHtml;
        onHtmlChange(block.id, newHtml);
        injectCopyButtons();
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
      const rawHtml = editorRef.current?.innerHTML || "";
      const cleanHtml = stripCopyButtons(rawHtml);
      const parts = cleanHtml.split(marker.outerHTML);
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
        onInput={handleInput}
        onBlur={handleBlur} onKeyDown={handleKeyDown}
        className="block-editor-content w-full text-white outline-none min-h-[1.5rem] whitespace-pre-wrap
          [&_h1]:text-3xl [&_h1]:font-bold [&_p]:mb-3
          [&_pre]:bg-[#1e1e2e] [&_pre]:border [&_pre]:border-neutral-700 [&_pre]:border-l-4 [&_pre]:border-l-blue-500
          [&_pre]:p-4 [&_pre]:pl-5 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed
          [&_pre]:text-[#a6e3a1] [&_pre]:shadow-lg [&_pre]:shadow-black/30 [&_pre]:my-3 [&_pre]:overflow-x-auto"
      />
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-10">
        <button onClick={() => onAddBelow(block.id)} className="p-1.5 bg-blue-600 text-white rounded-full shadow-lg"><Plus size={16} /></button>
      </div>
    </div>
  );
});
