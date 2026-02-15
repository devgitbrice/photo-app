"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Slide, SlideElement, MindmapNode } from "../types";
import { ICON_MAP } from "./IconMap";
import ShapeSVG from "./ShapeSVG";

type Props = {
  slide: Slide;
  updateSlide: (s: Slide) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  nightMode?: boolean;
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

export default function SlideCanvas({ slide, updateSlide, selectedId, setSelectedId, editingId, setEditingId, nightMode }: Props) {
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

  // ─── Text keydown: Enter = newline + auto-bullets, Space = auto-bullet conversion ──
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, el: SlideElement) => {
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
        // If the line is ONLY the number prefix (empty bullet), don't continue
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

  // ─── Render element content ────────────────────────────────
  const renderContent = (el: SlideElement) => {
    const s = el.style;

    if (el.type === "text") {
      const isEditing = editingId === el.id;
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
            onKeyDown={isEditing ? (e) => handleTextKeyDown(e, el) : undefined}
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
              letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : undefined,
              textDecoration: s.textDecoration || "none",
              textShadow: s.textShadow || "none",
              WebkitTextStroke: s.WebkitTextStroke || undefined,
              padding: s.padding ?? 8,
              columnCount: s.columns || undefined,
              columnGap: s.columns ? "16px" : undefined,
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
          src={el.src}
          alt=""
          draggable={false}
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
      const isEditing = editingId === el.id;
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
              onKeyDown={isEditing ? (e) => handleTextKeyDown(e, el) : undefined}
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

      // Formula evaluation helper
      const cellRef = (ref: string): number => {
        const m = ref.match(/^([A-Z])(\d+)$/i);
        if (!m) return 0;
        const col = m[1].toUpperCase().charCodeAt(0) - 65;
        const row = parseInt(m[2]) - 1;
        if (row < 0 || row >= data.length || col < 0 || col >= data[0].length) return 0;
        const val = data[row][col];
        if (val.startsWith("=")) return evalFormula(val);
        return parseFloat(val) || 0;
      };

      const evalFormula = (formula: string): number => {
        if (!formula.startsWith("=")) return parseFloat(formula) || 0;
        const expr = formula.slice(1).trim();

        // SUM(A1:A3)
        const sumMatch = expr.match(/^SUM\(([A-Z]\d+):([A-Z]\d+)\)$/i);
        if (sumMatch) {
          const startCol = sumMatch[1][0].toUpperCase().charCodeAt(0) - 65;
          const startRow = parseInt(sumMatch[1].slice(1)) - 1;
          const endCol = sumMatch[2][0].toUpperCase().charCodeAt(0) - 65;
          const endRow = parseInt(sumMatch[2].slice(1)) - 1;
          let sum = 0;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              if (r >= 0 && r < data.length && c >= 0 && c < data[0].length) {
                const v = data[r][c];
                sum += v.startsWith("=") ? evalFormula(v) : (parseFloat(v) || 0);
              }
            }
          }
          return sum;
        }

        // AVG(A1:A3)
        const avgMatch = expr.match(/^AVG\(([A-Z]\d+):([A-Z]\d+)\)$/i);
        if (avgMatch) {
          const startCol = avgMatch[1][0].toUpperCase().charCodeAt(0) - 65;
          const startRow = parseInt(avgMatch[1].slice(1)) - 1;
          const endCol = avgMatch[2][0].toUpperCase().charCodeAt(0) - 65;
          const endRow = parseInt(avgMatch[2].slice(1)) - 1;
          let sum = 0, count = 0;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              if (r >= 0 && r < data.length && c >= 0 && c < data[0].length) {
                const v = data[r][c];
                sum += v.startsWith("=") ? evalFormula(v) : (parseFloat(v) || 0);
                count++;
              }
            }
          }
          return count > 0 ? sum / count : 0;
        }

        // MIN(A1:A3)
        const minMatch = expr.match(/^MIN\(([A-Z]\d+):([A-Z]\d+)\)$/i);
        if (minMatch) {
          const startCol = minMatch[1][0].toUpperCase().charCodeAt(0) - 65;
          const startRow = parseInt(minMatch[1].slice(1)) - 1;
          const endCol = minMatch[2][0].toUpperCase().charCodeAt(0) - 65;
          const endRow = parseInt(minMatch[2].slice(1)) - 1;
          let min = Infinity;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              if (r >= 0 && r < data.length && c >= 0 && c < data[0].length) {
                const v = data[r][c];
                const n = v.startsWith("=") ? evalFormula(v) : (parseFloat(v) || 0);
                if (n < min) min = n;
              }
            }
          }
          return min === Infinity ? 0 : min;
        }

        // MAX(A1:A3)
        const maxMatch = expr.match(/^MAX\(([A-Z]\d+):([A-Z]\d+)\)$/i);
        if (maxMatch) {
          const startCol = maxMatch[1][0].toUpperCase().charCodeAt(0) - 65;
          const startRow = parseInt(maxMatch[1].slice(1)) - 1;
          const endCol = maxMatch[2][0].toUpperCase().charCodeAt(0) - 65;
          const endRow = parseInt(maxMatch[2].slice(1)) - 1;
          let max = -Infinity;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              if (r >= 0 && r < data.length && c >= 0 && c < data[0].length) {
                const v = data[r][c];
                const n = v.startsWith("=") ? evalFormula(v) : (parseFloat(v) || 0);
                if (n > max) max = n;
              }
            }
          }
          return max === -Infinity ? 0 : max;
        }

        // Simple arithmetic: A1+B1, A1-B1, A1*B1, A1/B1
        const arithMatch = expr.match(/^([A-Z]\d+)\s*([+\-*/])\s*([A-Z]\d+)$/i);
        if (arithMatch) {
          const a = cellRef(arithMatch[1]);
          const b = cellRef(arithMatch[3]);
          switch (arithMatch[2]) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": return b !== 0 ? a / b : 0;
          }
        }

        // Single cell ref
        if (/^[A-Z]\d+$/i.test(expr)) return cellRef(expr);

        return parseFloat(expr) || 0;
      };

      const displayCell = (val: string): string => {
        if (!val.startsWith("=")) return val;
        try {
          const result = evalFormula(val);
          return Number.isFinite(result) ? (Number.isInteger(result) ? result.toString() : result.toFixed(2)) : "ERR";
        } catch {
          return "ERR";
        }
      };

      const isSelected = selectedId === el.id;

      return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <table className="w-full h-full border-collapse" style={{ fontSize: s.fontSize || 14 }}>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      contentEditable
                      suppressContentEditableWarning
                      onMouseDown={(e) => e.stopPropagation()}
                      onFocus={(e) => {
                        // Show raw formula when editing
                        if (cell.startsWith("=")) {
                          e.currentTarget.innerText = cell;
                        }
                      }}
                      onBlur={(e) => {
                        const newData = data.map((r) => [...r]);
                        newData[ri][ci] = e.currentTarget.innerText;
                        updateElement(el.id, { tableData: newData });
                        // Show computed value
                        if (e.currentTarget.innerText.startsWith("=")) {
                          e.currentTarget.innerText = displayCell(e.currentTarget.innerText);
                        }
                      }}
                      className="border border-gray-300 px-2 py-1"
                      style={{
                        color: s.color || "#333",
                        backgroundColor: ri === 0 ? (s.backgroundColor || "#f3f4f6") : "transparent",
                        fontWeight: ri === 0 ? "bold" : "normal",
                        minWidth: "40px",
                      }}
                    >
                      {displayCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Add row/column buttons - shown when element is selected */}
          {isSelected && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(el.id, { tableData: [...data, Array(data[0].length).fill("")] });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)",
                  background: "#ea580c", color: "#fff", border: "none", borderRadius: 4,
                  fontSize: 11, padding: "2px 10px", cursor: "pointer", whiteSpace: "nowrap",
                  zIndex: 100,
                }}
                title="Ajouter une ligne"
              >
                + Ligne
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(el.id, { tableData: data.map((r) => [...r, ""]) });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "absolute", right: -28, top: "50%", transform: "translateY(-50%) rotate(90deg)",
                  background: "#ea580c", color: "#fff", border: "none", borderRadius: 4,
                  fontSize: 11, padding: "2px 6px", cursor: "pointer", whiteSpace: "nowrap",
                  zIndex: 100,
                }}
                title="Ajouter une colonne"
              >
                + Col
              </button>
            </>
          )}
        </div>
      );
    }

    // ─── Mindmap ────────────────────────────────────────────
    if (el.type === "mindmap") {
      const root = el.mindmapData || { id: "root", label: "Idée centrale", children: [] };
      const isSelected = selectedId === el.id;

      const renderMindmapNode = (
        node: MindmapNode,
        depth: number,
        parentX: number,
        parentY: number,
        x: number,
        y: number,
        elements: React.ReactNode[],
        lines: React.ReactNode[],
      ) => {
        const colors = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
        const color = colors[depth % colors.length];
        const nodeW = depth === 0 ? 140 : 110;
        const nodeH = depth === 0 ? 40 : 30;
        const fontSize = depth === 0 ? 14 : 11;
        const fontWeight = depth === 0 ? "bold" : "normal";

        if (depth > 0) {
          lines.push(
            <line
              key={`line-${node.id}`}
              x1={parentX} y1={parentY}
              x2={x} y2={y + nodeH / 2}
              stroke={color} strokeWidth={2} opacity={0.6}
            />
          );
        }

        elements.push(
          <foreignObject key={node.id} x={x - nodeW / 2} y={y} width={nodeW} height={nodeH}>
            <div
              style={{
                width: "100%", height: "100%",
                background: depth === 0 ? color : `${color}22`,
                border: `2px solid ${color}`,
                borderRadius: depth === 0 ? 20 : 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "2px 6px", overflow: "hidden",
              }}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const updateNode = (n: MindmapNode): MindmapNode => {
                    if (n.id === node.id) return { ...n, label: e.currentTarget.innerText };
                    return { ...n, children: n.children.map(updateNode) };
                  };
                  updateElement(el.id, { mindmapData: updateNode(root) });
                }}
                style={{
                  fontSize, fontWeight,
                  color: depth === 0 ? "#fff" : (s.color || "#333"),
                  textAlign: "center",
                  outline: "none",
                  cursor: "text",
                  width: "100%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {node.label}
              </div>
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const addChild = (n: MindmapNode): MindmapNode => {
                      if (n.id === node.id) return {
                        ...n,
                        children: [...n.children, { id: crypto.randomUUID(), label: "Nouveau", children: [] }],
                      };
                      return { ...n, children: n.children.map(addChild) };
                    };
                    updateElement(el.id, { mindmapData: addChild(root) });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: color, color: "#fff", border: "none", borderRadius: "50%",
                    width: 16, height: 16, fontSize: 12, lineHeight: "14px",
                    cursor: "pointer", flexShrink: 0, display: "flex",
                    alignItems: "center", justifyContent: "center", marginLeft: 2,
                  }}
                  title="Ajouter un enfant"
                >+</button>
              )}
            </div>
          </foreignObject>
        );

        if (isSelected && depth > 0) {
          elements.push(
            <foreignObject key={`del-${node.id}`} x={x + nodeW / 2 - 6} y={y - 6} width={14} height={14}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const removeNode = (n: MindmapNode): MindmapNode => ({
                    ...n, children: n.children.filter((c) => c.id !== node.id).map(removeNode),
                  });
                  updateElement(el.id, { mindmapData: removeNode(root) });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%",
                  width: 14, height: 14, fontSize: 10, lineHeight: "12px",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
                title="Supprimer"
              >x</button>
            </foreignObject>
          );
        }
      };

      // Layout: simple tree layout
      const layoutTree = (node: MindmapNode, depth: number, yStart: number, yEnd: number, svgW: number): { x: number; y: number; childBounds: { yMin: number; yMax: number } }[] => {
        return [];
      };

      // Recursive render of mindmap tree
      const allElements: React.ReactNode[] = [];
      const allLines: React.ReactNode[] = [];

      const renderTree = (
        node: MindmapNode,
        depth: number,
        x: number,
        yCenter: number,
        totalHeight: number,
        parentX: number,
        parentY: number,
      ) => {
        const nodeH = depth === 0 ? 40 : 30;
        const y = yCenter - nodeH / 2;

        renderMindmapNode(node, depth, parentX, parentY, x, y, allElements, allLines);

        if (node.children.length > 0) {
          const childSpacing = Math.min(50, totalHeight / node.children.length);
          const totalChildH = node.children.length * childSpacing;
          const startY = yCenter - totalChildH / 2 + childSpacing / 2;
          const nextX = x + (depth === 0 ? 160 : 130);

          node.children.forEach((child, i) => {
            const childYCenter = startY + i * childSpacing;
            renderTree(child, depth + 1, nextX, childYCenter, childSpacing, x, yCenter);
          });
        }
      };

      // Measure total depth to compute width distribution
      const getMaxDepth = (n: MindmapNode, d: number): number => {
        if (n.children.length === 0) return d;
        return Math.max(...n.children.map((c) => getMaxDepth(c, d + 1)));
      };
      const getNodeCount = (n: MindmapNode): number => {
        return 1 + n.children.reduce((sum, c) => sum + getNodeCount(c), 0);
      };

      const svgW = 800;
      const svgH = Math.max(400, getNodeCount(root) * 45);
      const startX = 80;
      const centerY = svgH / 2;

      renderTree(root, 0, startX, centerY, svgH * 0.8, startX, centerY);

      return (
        <div style={{ width: "100%", height: "100%", overflow: "auto", background: s.backgroundColor || "transparent" }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "100%", minWidth: svgW, minHeight: svgH }}>
            {allLines}
            {allElements}
          </svg>
        </div>
      );
    }

    // ─── Code block ─────────────────────────────────────────
    if (el.type === "code") {
      const isEditing = editingId === el.id;
      const code = el.codeContent || "// Votre code ici";
      const lang = el.codeLanguage || "javascript";

      // Simple syntax highlighting
      const highlightCode = (text: string, language: string): React.ReactNode[] => {
        const lines = text.split("\n");
        return lines.map((line, li) => {
          const parts: React.ReactNode[] = [];
          let remaining = line;
          let key = 0;

          // Comment highlighting
          const commentIdx = language === "python" ? remaining.indexOf("#") :
            (language === "html" || language === "xml") ? -1 :
            remaining.indexOf("//");
          if (commentIdx >= 0 && !remaining.slice(0, commentIdx).includes('"') && !remaining.slice(0, commentIdx).includes("'")) {
            if (commentIdx > 0) {
              parts.push(...highlightLine(remaining.slice(0, commentIdx), language, key));
              key += 100;
            }
            parts.push(<span key={`c${li}`} style={{ color: "#6a9955" }}>{remaining.slice(commentIdx)}</span>);
            return <div key={li}>{parts}</div>;
          }

          parts.push(...highlightLine(remaining, language, li * 1000));
          return <div key={li}>{parts}</div>;
        });
      };

      const highlightLine = (line: string, language: string, startKey: number): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        // Regex-based token highlighting
        const tokenRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b(?:function|const|let|var|if|else|for|while|return|import|export|from|class|extends|new|this|async|await|try|catch|throw|switch|case|break|continue|default|typeof|instanceof|in|of|true|false|null|undefined|def|print|self|elif|None|True|False|int|str|float|list|dict|public|private|protected|static|void|String|boolean|final|override|abstract|interface|implements|package|struct|fn|mut|pub|impl|use|mod|type|enum)\b|[{}()[\];,.])/g;

        let lastIndex = 0;
        let match;
        while ((match = tokenRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(<span key={startKey++}>{line.slice(lastIndex, match.index)}</span>);
          }
          const token = match[0];
          let color = "#d4d4d4"; // default

          if (/^["'`]/.test(token)) {
            color = "#ce9178"; // strings
          } else if (/^\d/.test(token)) {
            color = "#b5cea8"; // numbers
          } else if (/^(function|const|let|var|if|else|for|while|return|import|export|from|class|extends|new|async|await|try|catch|throw|switch|case|break|continue|default|def|print|self|elif|public|private|protected|static|void|final|override|abstract|interface|implements|package|struct|fn|mut|pub|impl|use|mod|type|enum)$/.test(token)) {
            color = "#569cd6"; // keywords
          } else if (/^(this|self|None|null|undefined|True|False|true|false)$/.test(token)) {
            color = "#569cd6"; // special values
          } else if (/^(int|str|float|list|dict|String|boolean)$/.test(token)) {
            color = "#4ec9b0"; // types
          } else if (/^[{}()[\]]$/.test(token)) {
            color = "#ffd700"; // brackets
          } else if (/^[;,.]$/.test(token)) {
            color = "#808080"; // punctuation
          }

          parts.push(<span key={startKey++} style={{ color }}>{token}</span>);
          lastIndex = match.index + token.length;
        }
        if (lastIndex < line.length) {
          parts.push(<span key={startKey++}>{line.slice(lastIndex)}</span>);
        }
        return parts;
      };

      return (
        <div
          style={{
            width: "100%", height: "100%",
            backgroundColor: "#1e1e1e",
            borderRadius: 8,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Code header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 12px",
            backgroundColor: "#2d2d2d",
            borderBottom: "1px solid #404040",
          }}>
            <span style={{ color: "#808080", fontSize: 11, fontFamily: "monospace" }}>
              {lang}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(el.codeContent || "");
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                background: "transparent",
                border: "1px solid #555",
                borderRadius: 4,
                color: "#ccc",
                fontSize: 11,
                padding: "2px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Copier le code"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copier
            </button>
          </div>
          {/* Code content */}
          <div
            style={{
              flex: 1,
              padding: "12px 16px",
              overflow: "auto",
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: s.fontSize || 13,
              lineHeight: 1.6,
              color: "#d4d4d4",
              whiteSpace: "pre",
              cursor: isEditing ? "text" : "default",
              outline: "none",
            }}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingId(el.id);
            }}
            onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
            onBlur={(e) => {
              updateElement(el.id, { codeContent: e.currentTarget.innerText });
              setEditingId(null);
            }}
          >
            {isEditing ? code : highlightCode(code, lang)}
          </div>
        </div>
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
        style={{
          backgroundColor: slide.backgroundColor || "#ffffff",
          filter: nightMode ? "invert(1)" : "none",
        }}
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
