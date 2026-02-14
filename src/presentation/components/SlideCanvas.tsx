"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Slide, SlideElement } from "../types";
import { ICON_MAP } from "./IconMap";
import ShapeSVG from "./ShapeSVG";

type Props = {
  slide: Slide;
  updateSlide: (s: Slide) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
};

type DragState = {
  type: "move" | "resize";
  elementId: string;
  handle?: string; // nw, n, ne, e, se, s, sw, w
  startMouseX: number;
  startMouseY: number;
  startEl: { x: number; y: number; width: number; height: number };
};

const HANDLE_SIZE = 8;
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export default function SlideCanvas({ slide, updateSlide, selectedId, setSelectedId, editingId, setEditingId }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { px: 0, py: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return { px: ((clientX - r.left) / r.width) * 100, py: ((clientY - r.top) / r.height) * 100 };
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    updateSlide({
      ...slide,
      elements: slide.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    });
  }, [slide, updateSlide]);

  const deleteElement = useCallback((id: string) => {
    updateSlide({ ...slide, elements: slide.elements.filter((el) => el.id !== id) });
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  }, [slide, updateSlide, selectedId, editingId, setSelectedId, setEditingId]);

  // ─── Mouse handlers ────────────────────────────────────────
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return;
    const { px, py } = toPercent(e.clientX, e.clientY);
    const dx = px - toPercent(drag.startMouseX, drag.startMouseY).px;
    const dy = py - toPercent(drag.startMouseX, drag.startMouseY).py;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - drag.startMouseX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startMouseY) / rect.height) * 100;

    if (drag.type === "move") {
      updateElement(drag.elementId, {
        x: Math.max(0, Math.min(100 - drag.startEl.width, drag.startEl.x + dxPct)),
        y: Math.max(0, Math.min(100 - drag.startEl.height, drag.startEl.y + dyPct)),
      });
    } else if (drag.type === "resize" && drag.handle) {
      const h = drag.handle;
      let { x, y, width, height } = drag.startEl;
      if (h.includes("e")) width = Math.max(5, width + dxPct);
      if (h.includes("w")) { x = x + dxPct; width = Math.max(5, width - dxPct); }
      if (h.includes("s")) height = Math.max(3, height + dyPct);
      if (h.includes("n")) { y = y + dyPct; height = Math.max(3, height - dyPct); }
      updateElement(drag.elementId, { x: Math.max(0, x), y: Math.max(0, y), width, height });
    }
  }, [drag, toPercent, updateElement]);

  const onMouseUp = useCallback(() => setDrag(null), []);

  useEffect(() => {
    if (drag) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [drag, onMouseMove, onMouseUp]);

  // ─── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedId || editingId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteElement(selectedId);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
      }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const el = slide.elements.find((e) => e.id === selectedId);
        if (el) {
          const dup: SlideElement = { ...el, id: crypto.randomUUID(), x: el.x + 3, y: el.y + 3, zIndex: Math.max(...slide.elements.map((e) => e.zIndex)) + 1 };
          updateSlide({ ...slide, elements: [...slide.elements, dup] });
          setSelectedId(dup.id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, editingId, slide, deleteElement, setSelectedId, updateSlide]);

  const startMove = (e: React.MouseEvent, el: SlideElement) => {
    if (el.locked || editingId === el.id) return;
    e.stopPropagation();
    setDrag({
      type: "move", elementId: el.id,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startEl: { x: el.x, y: el.y, width: el.width, height: el.height },
    });
  };

  const startResize = (e: React.MouseEvent, el: SlideElement, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDrag({
      type: "resize", elementId: el.id, handle,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startEl: { x: el.x, y: el.y, width: el.width, height: el.height },
    });
  };

  const handlePos = (handle: string) => {
    const m: Record<string, { left: string; top: string; cursor: string }> = {
      nw: { left: "-4px", top: "-4px", cursor: "nw-resize" },
      n: { left: "50%", top: "-4px", cursor: "n-resize" },
      ne: { left: "calc(100% - 4px)", top: "-4px", cursor: "ne-resize" },
      e: { left: "calc(100% - 4px)", top: "50%", cursor: "e-resize" },
      se: { left: "calc(100% - 4px)", top: "calc(100% - 4px)", cursor: "se-resize" },
      s: { left: "50%", top: "calc(100% - 4px)", cursor: "s-resize" },
      sw: { left: "-4px", top: "calc(100% - 4px)", cursor: "sw-resize" },
      w: { left: "-4px", top: "50%", cursor: "w-resize" },
    };
    return m[handle];
  };

  // ─── Render element content ────────────────────────────────
  const renderContent = (el: SlideElement) => {
    const s = el.style;

    if (el.type === "text") {
      const isEditing = editingId === el.id;
      return (
        <div
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => {
            updateElement(el.id, { content: e.currentTarget.innerText });
            setEditingId(null);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingId(el.id);
          }}
          style={{
            width: "100%", height: "100%",
            fontSize: s.fontSize || 18,
            fontFamily: s.fontFamily || "Arial",
            fontWeight: s.fontWeight || "normal",
            fontStyle: s.fontStyle || "normal",
            color: s.color || "#333",
            backgroundColor: s.backgroundColor || "transparent",
            textAlign: s.textAlign || "left",
            lineHeight: s.lineHeight || 1.4,
            letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : undefined,
            textDecoration: s.textDecoration || "none",
            textShadow: s.textShadow || "none",
            WebkitTextStroke: s.WebkitTextStroke || undefined,
            padding: s.padding ?? 8,
            columnCount: s.columns || undefined,
            columnGap: s.columns ? "16px" : undefined,
            display: "flex",
            alignItems: s.verticalAlign === "middle" ? "center" : s.verticalAlign === "bottom" ? "flex-end" : "flex-start",
            overflow: "hidden",
            outline: isEditing ? "2px solid #ea580c" : "none",
            cursor: isEditing ? "text" : "default",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {el.content || ""}
        </div>
      );
    }

    if (el.type === "image") {
      return (
        <img
          src={el.src}
          alt=""
          draggable={false}
          style={{
            width: "100%", height: "100%",
            objectFit: el.objectFit || "contain",
            borderRadius: s.borderRadius || 0,
            opacity: s.opacity ?? 1,
          }}
        />
      );
    }

    if (el.type === "shape") {
      return (
        <ShapeSVG
          shapeType={el.shapeType || "rectangle"}
          fill={s.fill || "#3b82f6"}
          stroke={s.stroke || "none"}
          strokeWidth={s.strokeWidth || 0}
        />
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
                  <td
                    key={ci}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newData = data.map((r) => [...r]);
                      newData[ri][ci] = e.currentTarget.innerText;
                      updateElement(el.id, { tableData: newData });
                    }}
                    className="border border-gray-300 px-2 py-1"
                    style={{
                      color: s.color || "#333",
                      backgroundColor: ri === 0 ? (s.backgroundColor || "#f3f4f6") : "transparent",
                      fontWeight: ri === 0 ? "bold" : "normal",
                      minWidth: "40px",
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

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-neutral-950 flex items-center justify-center p-4 overflow-hidden">
      <div
        ref={canvasRef}
        id="slide-canvas"
        className="aspect-video w-full max-w-4xl relative overflow-hidden shadow-2xl rounded-sm select-none"
        style={{ backgroundColor: slide.backgroundColor || "#ffffff" }}
        onClick={(e) => {
          if (e.target === canvasRef.current) {
            setSelectedId(null);
            setEditingId(null);
          }
        }}
      >
        {[...slide.elements]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const isSelected = selectedId === el.id;
            return (
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
                  border: isSelected ? "2px solid #3b82f6" : el.style.border || "none",
                  borderRadius: el.style.borderRadius || 0,
                  cursor: drag?.elementId === el.id ? "grabbing" : el.locked ? "default" : "grab",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                onMouseDown={(e) => startMove(e, el)}
              >
                {renderContent(el)}

                {/* Resize handles */}
                {isSelected && !el.locked && HANDLES.map((h) => {
                  const pos = handlePos(h);
                  return (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        left: pos.left,
                        top: pos.top,
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        backgroundColor: "#3b82f6",
                        border: "1px solid white",
                        cursor: pos.cursor,
                        zIndex: 9999,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseDown={(e) => startResize(e, el, h)}
                    />
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
}
