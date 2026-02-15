import React, { useEffect, useRef, useCallback } from "react";
import { DocBlock } from "../types";

interface FocusModalProps {
  block: DocBlock;
  onChange: (id: string, html: string) => void;
  onClose: () => void;
}

/** Remove injected copy buttons from HTML before saving */
function stripCopyButtons(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll(".code-copy-btn").forEach((btn) => btn.remove());
  return div.innerHTML;
}

export default function FocusModal({ block, onChange, onClose }: FocusModalProps) {
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
      pre.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
      pre.addEventListener("mouseleave", (e) => {
        const related = e.relatedTarget as HTMLElement | null;
        if (related !== btn && !btn.contains(related)) btn.style.opacity = "0";
      });
      pre.appendChild(btn);
    });
  }, []);

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
    injectCopyButtons();
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

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = stripCopyButtons(editorRef.current.innerHTML);
    onChange(block.id, html);
    setTimeout(injectCopyButtons, 0);
  };

  const handleBlur = () => {
    if (editorRef.current) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = stripCopyButtons(editorRef.current.innerHTML);
      linkifyNode(tempDiv);
      const currentClean = stripCopyButtons(editorRef.current.innerHTML);
      if (tempDiv.innerHTML !== currentClean) {
        editorRef.current.innerHTML = tempDiv.innerHTML;
        onChange(block.id, tempDiv.innerHTML);
        injectCopyButtons();
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
          onInput={handleInput}
          onBlur={handleBlur}
          className="w-full text-white text-lg leading-relaxed outline-none min-h-[50vh]
            [&_a]:text-blue-400 [&_a]:underline
            [&_h1]:text-4xl [&_h1]:font-bold [&_p]:mb-4
            [&_pre]:bg-[#1e1e2e] [&_pre]:border [&_pre]:border-neutral-700 [&_pre]:border-l-4 [&_pre]:border-l-blue-500
            [&_pre]:p-4 [&_pre]:pl-5 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed
            [&_pre]:text-[#a6e3a1] [&_pre]:shadow-lg [&_pre]:shadow-black/30 [&_pre]:my-3 [&_pre]:overflow-x-auto"
        />
      </div>
    </div>
  );
}
