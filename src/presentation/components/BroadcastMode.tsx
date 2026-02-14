"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Slide, SlideElement } from "../types";
import { ICON_MAP } from "./IconMap";
import ShapeSVG from "./ShapeSVG";

type Props = {
  slides: Slide[];
  initialIndex: number;
  onClose: () => void;
  onSlidesChange: (slides: Slide[]) => void;
  nightMode?: boolean;
};

// Fixed design resolution matching the normal editor (max-w-4xl = 896px, 16:9)
const DESIGN_W = 896;
const DESIGN_H = 504;

export default function BroadcastMode({ slides, initialIndex, onClose, onSlidesChange, nightMode }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const slide = slides[currentIndex];

  // Calculate scale to fit the design resolution into the available space
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const sw = clientWidth / DESIGN_W;
      const sh = clientHeight / DESIGN_H;
      setScale(Math.min(sw, sh));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setEditingId(null);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, slides.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setEditingId(null);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture arrow keys when editing text
      if (editingId) {
        if (e.key === "Escape") {
          setEditingId(null);
        }
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "Escape" || e.key === "Enter") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, goNext, goPrev, onClose]);

  const updateElement = (id: string, updates: Partial<SlideElement>) => {
    const newSlides = slides.map((s, i) => {
      if (i !== currentIndex) return s;
      return { ...s, elements: s.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)) };
    });
    onSlidesChange(newSlides);
  };

  // Handle text keydown for auto-bullets (same logic as SlideCanvas)
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const node = sel.anchorNode;
      const offset = sel.anchorOffset;
      const text = node?.textContent || "";
      const beforeCursor = text.slice(0, offset);
      const lastNL = beforeCursor.lastIndexOf("\n");
      const currentLine = beforeCursor.slice(lastNL + 1);

      let prefix = "";
      const numMatch = currentLine.match(/^(\d+)\.\s/);
      if (numMatch) {
        const lineContent = currentLine.slice(numMatch[0].length);
        if (lineContent.trim().length > 0) {
          prefix = `${parseInt(numMatch[1]) + 1}. `;
        }
      } else if (currentLine.match(/^[•]\s/)) {
        const lineContent = currentLine.slice(2);
        if (lineContent.trim().length > 0) {
          prefix = "\u2022 ";
        }
      }
      document.execCommand("insertText", false, "\n" + prefix);
    }

    if (e.key === " ") {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const node = sel.anchorNode;
      const offset = sel.anchorOffset;
      const text = node?.textContent || "";
      const beforeCursor = text.slice(0, offset);
      const lastNL = beforeCursor.lastIndexOf("\n");
      const lineBeforeCursor = beforeCursor.slice(lastNL + 1);

      if (lineBeforeCursor === "-" || lineBeforeCursor === "*") {
        e.preventDefault();
        const range = sel.getRangeAt(0);
        range.setStart(node!, offset - 1);
        range.setEnd(node!, offset);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("insertText", false, "\u2022 ");
      }
    }
  };

  const renderElement = (el: SlideElement) => {
    const s = el.style;
    const isEditing = editingId === el.id;

    if (el.type === "text") {
      const vAlign = s.verticalAlign === "middle" ? "center" : s.verticalAlign === "bottom" ? "flex-end" : "flex-start";
      return (
        <div
          style={{
            width: "100%", height: "100%",
            display: "flex",
            alignItems: vAlign,
            overflow: "hidden",
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingId(el.id);
          }}
        >
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => {
              updateElement(el.id, { content: e.currentTarget.innerText });
              setEditingId(null);
            }}
            onKeyDown={isEditing ? handleTextKeyDown : undefined}
            style={{
              width: "100%",
              fontSize: s.fontSize || 18,
              fontFamily: s.fontFamily || "Arial",
              fontWeight: s.fontWeight || "normal",
              fontStyle: s.fontStyle || "normal",
              color: s.color || "#333",
              backgroundColor: s.backgroundColor || "transparent",
              textAlign: s.textAlign || "left",
              lineHeight: s.lineHeight || 1.4,
              textDecoration: s.textDecoration || "none",
              textShadow: s.textShadow || "none",
              WebkitTextStroke: s.WebkitTextStroke || undefined,
              padding: s.padding ?? 8,
              outline: isEditing ? "2px solid #ea580c" : "none",
              cursor: isEditing ? "text" : "default",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {el.content || ""}
          </div>
        </div>
      );
    }

    if (el.type === "image") {
      return (
        <img
          src={el.src} alt="" draggable={false}
          style={{
            width: "100%", height: "100%",
            objectFit: el.objectFit || "contain",
            borderRadius: s.borderRadius || 0,
            opacity: s.opacity ?? 1,
            filter: nightMode ? "invert(1)" : "none",
          }}
        />
      );
    }

    if (el.type === "shape") {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <ShapeSVG
            shapeType={el.shapeType || "rectangle"}
            fill={s.fill || "#3b82f6"}
            stroke={s.stroke || "none"}
            strokeWidth={s.strokeWidth || 0}
          />
          {/* Text overlay for shape content */}
          <div
            style={{
              position: "absolute",
              inset: el.shapeType === "callout" ? "4% 4% 28% 4%" : "8%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingId(el.id);
            }}
          >
            <div
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={(e) => {
                updateElement(el.id, { content: e.currentTarget.innerText });
                setEditingId(null);
              }}
              onKeyDown={isEditing ? handleTextKeyDown : undefined}
              onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
              style={{
                width: "100%",
                textAlign: (s.textAlign as "left" | "center" | "right") || "center",
                fontSize: s.fontSize || 14,
                fontFamily: s.fontFamily || "Arial",
                fontWeight: s.fontWeight || "normal",
                fontStyle: s.fontStyle || "normal",
                color: s.color || "#fff",
                lineHeight: s.lineHeight || 1.3,
                padding: 4,
                outline: isEditing ? "2px solid #ea580c" : "none",
                cursor: isEditing ? "text" : "default",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {el.content || ""}
            </div>
          </div>
        </div>
      );
    }

    if (el.type === "icon") {
      const IconComp = el.iconName ? ICON_MAP[el.iconName] : null;
      if (!IconComp) return <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>;
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ color: s.color || "#333" }}>
          <IconComp size={el.iconSize || Math.min(el.width, el.height) * 2} />
        </div>
      );
    }

    if (el.type === "table") {
      const data = el.tableData || [["", ""], ["", ""]];
      return (
        <table className="w-full h-full border-collapse" style={{ fontSize: s.fontSize || 14 }}>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-300 px-2 py-1"
                    style={{
                      color: s.color || "#333",
                      backgroundColor: ri === 0 ? (s.backgroundColor || "#f3f4f6") : "transparent",
                      fontWeight: ri === 0 ? "bold" : "normal",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      onClick={() => setEditingId(null)}
    >
      {/* Top bar - subtle, shows on hover */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <span className="text-white/60 text-sm">
          {currentIndex + 1} / {slides.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10"
          title="Quitter (Echap)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Slide area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-4">
        <div
          className="relative overflow-hidden rounded shadow-2xl"
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            backgroundColor: slide.backgroundColor || "#ffffff",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            filter: nightMode ? "invert(1)" : "none",
          }}
        >
          {[...slide.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: `${el.height}%`,
                  zIndex: el.zIndex,
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  opacity: el.style.opacity ?? 1,
                  borderRadius: el.style.borderRadius || 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {renderElement(el)}
              </div>
            ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-all"
        >
          <ChevronLeft size={32} />
        </button>
      )}
      {currentIndex < slides.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-all"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
