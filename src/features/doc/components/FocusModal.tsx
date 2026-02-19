import React, { useEffect, useRef, useCallback, useState } from "react";
import { List, ListOrdered, Volume2, Square, Loader2, ChevronLeft, ChevronRight, Play, FastForward, Copy, Check } from "lucide-react";
import { DocBlock } from "../types";
import { useTTS } from "@/hooks/useTTS";
import { useThemeStore } from "@/store/themeStore";
import { handleDocShortcut } from "../lib/docShortcuts";

type AutoMode = "off" | "auto" | "superauto";

interface FocusModalProps {
  block: DocBlock;
  onChange: (id: string, html: string) => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

/** Remove injected copy buttons from HTML before saving */
function stripCopyButtons(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll(".code-copy-btn").forEach((btn) => btn.remove());
  return div.innerHTML;
}

const TEXT_COLORS = [
  { label: "Blanc", value: "#ffffff" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Jaune", value: "#eab308" },
  { label: "Vert", value: "#22c55e" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Violet", value: "#a855f7" },
  { label: "Rose", value: "#ec4899" },
];

export default function FocusModal({ block, onChange, onClose, onNext, onPrev, hasPrev, hasNext }: FocusModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { state: ttsState, speak, stopPlayback } = useTTS();
  const [autoMode, setAutoMode] = useState<AutoMode>("off");
  const autoModeRef = useRef<AutoMode>("off");
  const isSpeakingRef = useRef(false);
  const light = useThemeStore((s) => s.theme) === "light";

  // Keep ref in sync with state
  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);

  // Floating toolbar state
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const floatingRef = useRef<HTMLDivElement>(null);

  const handleSpeak = useCallback(() => {
    if (ttsState === "playing" || ttsState === "loading") {
      stopPlayback();
      return;
    }
    const text = editorRef.current?.textContent?.trim() || "";
    if (text) speak(text);
  }, [ttsState, speak, stopPlayback]);

  /** Copy block content with formatting (rich text) */
  const handleCopyFormatted = useCallback(() => {
    if (!editorRef.current) return;
    const html = stripCopyButtons(editorRef.current.innerHTML);
    const text = editorRef.current.textContent?.trim() || "";
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([text], { type: "text/plain" });
    navigator.clipboard.write([new ClipboardItem({ "text/html": blob, "text/plain": textBlob })]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

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

  const handleNav = useCallback((direction: "prev" | "next") => {
    // Save current content before navigating
    if (editorRef.current) {
      const html = stripCopyButtons(editorRef.current.innerHTML);
      onChange(block.id, html);
    }
    if (direction === "prev") onPrev?.();
    else onNext?.();
  }, [block.id, onChange, onPrev, onNext]);

  const toggleAutoMode = useCallback((mode: AutoMode) => {
    if (autoMode === mode) {
      // Turn off
      stopPlayback();
      isSpeakingRef.current = false;
      setAutoMode("off");
    } else {
      // Switch to this mode (stop current playback first)
      stopPlayback();
      isSpeakingRef.current = false;
      setAutoMode(mode);
    }
  }, [autoMode, stopPlayback]);

  // Stop auto mode when closing
  const handleClose = useCallback(() => {
    stopPlayback();
    isSpeakingRef.current = false;
    setAutoMode("off");
    onClose();
  }, [stopPlayback, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    if (editorRef.current) {
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
  }, [block.id, injectCopyButtons]);

  // Auto-play TTS when block changes (AUTO & SUPER AUTO modes)
  useEffect(() => {
    if (autoModeRef.current === "off") return;
    if (isSpeakingRef.current) return;

    const text = (() => {
      const div = document.createElement("div");
      div.innerHTML = block.html || "";
      return div.textContent?.trim() || "";
    })();
    if (!text) {
      // Empty block in superauto: skip to next
      if (autoModeRef.current === "superauto" && hasNext) {
        setTimeout(() => onNext?.(), 300);
      }
      return;
    }

    isSpeakingRef.current = true;
    speak(text).then(() => {
      isSpeakingRef.current = false;
      // SUPER AUTO: auto-advance to next block after playback ends
      if (autoModeRef.current === "superauto" && hasNext) {
        setTimeout(() => onNext?.(), 400);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, autoMode]);

  // Floating toolbar: show on text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        // Small delay to allow clicking toolbar buttons
        setTimeout(() => {
          const sel2 = window.getSelection();
          if (!sel2 || sel2.isCollapsed) {
            setFloatingToolbar(prev => ({ ...prev, visible: false }));
            setShowColorPicker(false);
          }
        }, 200);
        return;
      }
      const range = sel.getRangeAt(0);
      // Only show if selection is inside the editor
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
      const rect = range.getBoundingClientRect();
      setFloatingToolbar({ x: rect.left + rect.width / 2, y: rect.top - 10, visible: true });
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Trackpad swipe navigation (horizontal wheel events) — one swipe = one block
  useEffect(() => {
    let accumulatedDeltaX = 0;
    let locked = false;
    let resetTimeout: ReturnType<typeof setTimeout> | null = null;
    const SWIPE_THRESHOLD = 80;
    const LOCK_MS = 400;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (locked) return;

      accumulatedDeltaX += e.deltaX;

      if (resetTimeout) clearTimeout(resetTimeout);
      resetTimeout = setTimeout(() => { accumulatedDeltaX = 0; }, 200);

      if (accumulatedDeltaX > SWIPE_THRESHOLD) {
        locked = true;
        accumulatedDeltaX = 0;
        if (hasNext) handleNav("next");
        setTimeout(() => { locked = false; }, LOCK_MS);
      } else if (accumulatedDeltaX < -SWIPE_THRESHOLD) {
        locked = true;
        accumulatedDeltaX = 0;
        if (hasPrev) handleNav("prev");
        setTimeout(() => { locked = false; }, LOCK_MS);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [hasNext, hasPrev, handleNav]);

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

  // Formatting commands
  const execCmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleInsertList = (ordered: boolean) => {
    editorRef.current?.focus();
    document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList", false);
    handleInput();
  };

  const handleTextColor = (color: string) => {
    execCmd("foreColor", color);
    setShowColorPicker(false);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (handleDocShortcut(e)) {
      handleInput();
    }
  };

  const toolbarBtnClass = light
    ? "p-2 bg-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-md transition-colors"
    : "p-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-md transition-colors";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${light ? "bg-white/80" : "bg-black/80"} backdrop-blur-sm p-4`} onClick={handleClose}>
      {/* Previous block arrow */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNav("prev"); }}
          title="Bloc précédent"
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all opacity-40 hover:opacity-100 ${light ? "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/80" : "text-neutral-500 hover:text-white hover:bg-neutral-800/80"}`}
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {/* Next block arrow */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNav("next"); }}
          title="Bloc suivant"
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all opacity-40 hover:opacity-100 ${light ? "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/80" : "text-neutral-500 hover:text-white hover:bg-neutral-800/80"}`}
        >
          <ChevronRight size={28} />
        </button>
      )}
      <div className={`w-full max-w-4xl border rounded-xl p-8 shadow-2xl overflow-y-auto max-h-[85vh] ${light ? "bg-white border-neutral-300" : "bg-neutral-900 border-neutral-700"}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`mb-4 flex justify-between items-center border-b pb-3 ${light ? "border-neutral-300" : "border-neutral-800"}`}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Mode Focus</span>
            {autoMode !== "off" && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse ${
                autoMode === "superauto" ? "bg-orange-600/20 text-orange-400" : "bg-blue-600/20 text-blue-400"
              }`}>
                {autoMode === "superauto" ? "Super Auto" : "Auto"}
              </span>
            )}
          </div>
          <button onClick={handleClose} className={`text-xs px-2 py-1 rounded transition-colors ${light ? "text-neutral-500 hover:text-neutral-900 bg-neutral-200" : "text-neutral-400 hover:text-white bg-neutral-800"}`}>Échap pour quitter</button>
        </div>

        {/* Toolbar */}
        <div className={`mb-4 flex items-center gap-2 border-b pb-3 ${light ? "border-neutral-300" : "border-neutral-800"}`}>
          <button
            onClick={() => handleInsertList(false)}
            title="Liste à puces"
            className={toolbarBtnClass}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => handleInsertList(true)}
            title="Liste numérotée"
            className={toolbarBtnClass}
          >
            <ListOrdered size={18} />
          </button>
          <div className={`w-px h-6 mx-1 ${light ? "bg-neutral-300" : "bg-neutral-700"}`} />
          <button
            onClick={handleCopyFormatted}
            title="Copier avec mise en forme"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-bold ${
              copied
                ? "bg-green-600 text-white"
                : light ? "bg-neutral-200 text-neutral-600 hover:text-neutral-900" : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copié !" : "Copier"}
          </button>
          <div className={`w-px h-6 mx-1 ${light ? "bg-neutral-300" : "bg-neutral-700"}`} />
          <button
            onClick={handleSpeak}
            title={ttsState === "playing" ? "Arrêter la lecture" : "Écouter le contenu"}
            className={`p-2 rounded-md transition-all ${
              ttsState === "playing"
                ? "bg-green-600 text-white animate-pulse"
                : ttsState === "loading"
                ? "bg-yellow-600 text-white"
                : toolbarBtnClass
            }`}
          >
            {ttsState === "loading" ? <Loader2 size={18} className="animate-spin" /> : ttsState === "playing" ? <Square size={16} /> : <Volume2 size={18} />}
          </button>
          <div className={`w-px h-6 mx-1 ${light ? "bg-neutral-300" : "bg-neutral-700"}`} />
          <button
            onClick={() => toggleAutoMode("auto")}
            title={autoMode === "auto" ? "Désactiver Auto" : "Auto : lit chaque bloc affiché"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-bold ${
              autoMode === "auto"
                ? "bg-blue-600 text-white ring-2 ring-blue-400/50"
                : light ? "bg-neutral-200 text-neutral-600 hover:text-neutral-900" : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Play size={14} />
            AUTO
          </button>
          <button
            onClick={() => toggleAutoMode("superauto")}
            title={autoMode === "superauto" ? "Désactiver Super Auto" : "Super Auto : lit et passe au bloc suivant automatiquement"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-bold ${
              autoMode === "superauto"
                ? "bg-orange-600 text-white ring-2 ring-orange-400/50 animate-pulse"
                : light ? "bg-neutral-200 text-neutral-600 hover:text-neutral-900" : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <FastForward size={14} />
            SUPER AUTO
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleEditorKeyDown}
          className={`w-full text-lg leading-relaxed outline-none min-h-[50vh]
            [&_a]:text-blue-400 [&_a]:underline
            [&_h1]:text-4xl [&_h1]:font-bold [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul_li]:mb-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol_li]:mb-1
            [&_pre]:border [&_pre]:border-l-4 [&_pre]:border-l-blue-500
            [&_pre]:p-4 [&_pre]:pl-5 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed
            [&_pre]:my-3 [&_pre]:overflow-x-auto
            ${light
              ? "text-neutral-900 [&_pre]:bg-neutral-100 [&_pre]:border-neutral-300 [&_pre]:text-neutral-800 [&_pre]:shadow-sm"
              : "text-white [&_pre]:bg-[#1e1e2e] [&_pre]:border-neutral-700 [&_pre]:text-[#a6e3a1] [&_pre]:shadow-lg [&_pre]:shadow-black/30"
            }`}
        />
      </div>

      {/* Floating selection toolbar */}
      {floatingToolbar.visible && (
        <div
          ref={floatingRef}
          onMouseDown={(e) => e.preventDefault()}
          className={`fixed z-[100] flex items-center gap-1 border rounded-lg shadow-2xl px-2 py-1.5 animate-in fade-in duration-150 ${light ? "bg-white border-neutral-300" : "bg-neutral-800 border-neutral-600"}`}
          style={{
            left: `${floatingToolbar.x}px`,
            top: `${floatingToolbar.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            onClick={() => execCmd("bold")}
            title="Gras"
            className={`p-1.5 rounded transition-colors font-bold text-sm ${light ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200" : "text-neutral-300 hover:text-white hover:bg-neutral-700"}`}
          >
            G
          </button>
          <button
            onClick={() => execCmd("italic")}
            title="Italique"
            className={`p-1.5 rounded transition-colors italic text-sm ${light ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200" : "text-neutral-300 hover:text-white hover:bg-neutral-700"}`}
          >
            I
          </button>
          <button
            onClick={() => execCmd("underline")}
            title="Souligné"
            className={`p-1.5 rounded transition-colors underline text-sm ${light ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200" : "text-neutral-300 hover:text-white hover:bg-neutral-700"}`}
          >
            S
          </button>
          <div className={`w-px h-5 mx-0.5 ${light ? "bg-neutral-300" : "bg-neutral-600"}`} />
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Couleur du texte"
              className={`p-1.5 rounded transition-colors text-sm flex items-center gap-1 ${light ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200" : "text-neutral-300 hover:text-white hover:bg-neutral-700"}`}
            >
              A
              <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
            </button>
            {showColorPicker && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 border rounded-lg shadow-2xl p-2 grid grid-cols-4 gap-1.5 min-w-[120px] ${light ? "bg-white border-neutral-300" : "bg-neutral-800 border-neutral-600"}`}
              >
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleTextColor(c.value)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full border hover:scale-110 transition-colors ${light ? "border-neutral-300 hover:border-neutral-900" : "border-neutral-600 hover:border-white"}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
