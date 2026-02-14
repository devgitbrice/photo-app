"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Column letter helper: 0→A, 1→B, ... 25→Z, 26→AA
function colLabel(index: number): string {
  let label = "";
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

interface TableGridProps {
  data: string[][];
  setData: (d: string[][]) => void;
}

export default function TableGrid({ data, setData }: TableGridProps) {
  const rows = data.length;
  const cols = data[0]?.length || 10;

  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selection, setSelection] = useState<{ start: { r: number; c: number }; end: { r: number; c: number } } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const newData = data.map((row) => [...row]);
    newData[editingCell.r][editingCell.c] = editValue;
    setData(newData);
    setEditingCell(null);
  }, [editingCell, editValue, data, setData]);

  const handleCellClick = (r: number, c: number) => {
    if (editingCell) commitEdit();
    setActiveCell({ r, c });
    setSelection({ start: { r, c }, end: { r, c } });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (r: number, c: number) => {
    setActiveCell({ r, c });
    setEditingCell({ r, c });
    setEditValue(data[r][c] || "");
  };

  const handleMouseDown = (r: number, c: number) => {
    if (editingCell) commitEdit();
    setIsSelecting(true);
    setActiveCell({ r, c });
    setSelection({ start: { r, c }, end: { r, c } });
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isSelecting && selection) {
      setSelection({ ...selection, end: { r, c } });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const isInSelection = (r: number, c: number) => {
    if (!selection) return false;
    const minR = Math.min(selection.start.r, selection.end.r);
    const maxR = Math.max(selection.start.r, selection.end.r);
    const minC = Math.min(selection.start.c, selection.end.c);
    const maxC = Math.max(selection.start.c, selection.end.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) {
        if (e.key === "Enter") {
          e.preventDefault();
          commitEdit();
          // Move down
          const nextR = Math.min(editingCell.r + 1, rows - 1);
          setActiveCell({ r: nextR, c: editingCell.c });
          setSelection({ start: { r: nextR, c: editingCell.c }, end: { r: nextR, c: editingCell.c } });
        } else if (e.key === "Tab") {
          e.preventDefault();
          commitEdit();
          const nextC = e.shiftKey
            ? Math.max(editingCell.c - 1, 0)
            : Math.min(editingCell.c + 1, cols - 1);
          setActiveCell({ r: editingCell.r, c: nextC });
          setSelection({ start: { r: editingCell.r, c: nextC }, end: { r: editingCell.r, c: nextC } });
        } else if (e.key === "Escape") {
          setEditingCell(null);
        }
        return;
      }

      if (!activeCell) return;

      const { r, c } = activeCell;

      if (e.key === "Enter") {
        e.preventDefault();
        setEditingCell({ r, c });
        setEditValue(data[r][c] || "");
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        setEditingCell({ r, c });
        setEditValue(data[r][c] || "");
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // Delete selection content
        if (selection) {
          const minR = Math.min(selection.start.r, selection.end.r);
          const maxR = Math.max(selection.start.r, selection.end.r);
          const minC = Math.min(selection.start.c, selection.end.c);
          const maxC = Math.max(selection.start.c, selection.end.c);
          const newData = data.map((row) => [...row]);
          for (let ri = minR; ri <= maxR; ri++) {
            for (let ci = minC; ci <= maxC; ci++) {
              newData[ri][ci] = "";
            }
          }
          setData(newData);
        }
        return;
      }

      let newR = r;
      let newC = c;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newR = Math.max(r - 1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          newR = Math.min(r + 1, rows - 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newC = Math.max(c - 1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          newC = Math.min(c + 1, cols - 1);
          break;
        case "Tab":
          e.preventDefault();
          newC = e.shiftKey ? Math.max(c - 1, 0) : Math.min(c + 1, cols - 1);
          break;
        default:
          // Start typing → enter edit mode
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setEditingCell({ r, c });
            setEditValue(e.key);
            return;
          }
          return;
      }

      setActiveCell({ r: newR, c: newC });
      if (e.shiftKey && (e.key.startsWith("Arrow") || e.key === "Tab")) {
        setSelection((prev) =>
          prev ? { start: prev.start, end: { r: newR, c: newC } } : { start: { r: newR, c: newC }, end: { r: newR, c: newC } }
        );
      } else {
        setSelection({ start: { r: newR, c: newC }, end: { r: newR, c: newC } });
      }
    },
    [activeCell, editingCell, editValue, data, rows, cols, selection, commitEdit, setData]
  );

  // Copy/Paste support
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (!selection || editingCell) return;
      e.preventDefault();
      const minR = Math.min(selection.start.r, selection.end.r);
      const maxR = Math.max(selection.start.r, selection.end.r);
      const minC = Math.min(selection.start.c, selection.end.c);
      const maxC = Math.max(selection.start.c, selection.end.c);
      const text = data
        .slice(minR, maxR + 1)
        .map((row) => row.slice(minC, maxC + 1).join("\t"))
        .join("\n");
      e.clipboardData?.setData("text/plain", text);
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!activeCell || editingCell) return;
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") || "";
      const pastedRows = text.split("\n").map((line) => line.split("\t"));
      const newData = data.map((row) => [...row]);
      for (let ri = 0; ri < pastedRows.length && activeCell.r + ri < rows; ri++) {
        for (let ci = 0; ci < pastedRows[ri].length && activeCell.c + ci < cols; ci++) {
          newData[activeCell.r + ri][activeCell.c + ci] = pastedRows[ri][ci];
        }
      }
      setData(newData);
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [selection, activeCell, editingCell, data, rows, cols, setData]);

  return (
    <div
      ref={tableRef}
      className="absolute inset-0 overflow-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="border-collapse w-full" style={{ minWidth: cols * 100 }}>
        {/* Column headers */}
        <thead className="sticky top-0 z-10">
          <tr>
            {/* Corner cell */}
            <th className="bg-neutral-800 border border-neutral-600 w-12 min-w-12 text-xs text-neutral-400 text-center sticky left-0 z-20" />
            {Array.from({ length: cols }, (_, c) => (
              <th
                key={c}
                className="bg-neutral-800 border border-neutral-600 px-2 py-1 text-xs font-semibold text-neutral-400 text-center min-w-[100px]"
              >
                {colLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, r) => (
            <tr key={r}>
              {/* Row header */}
              <th className="bg-neutral-800 border border-neutral-600 px-2 py-1 text-xs font-semibold text-neutral-400 text-center w-12 min-w-12 sticky left-0 z-[5]">
                {r + 1}
              </th>
              {row.map((cell, c) => {
                const isActive = activeCell?.r === r && activeCell?.c === c;
                const isEditing = editingCell?.r === r && editingCell?.c === c;
                const isSelected = isInSelection(r, c);

                return (
                  <td
                    key={c}
                    className={`border border-neutral-700 px-1 py-0 text-sm h-7 relative cursor-cell
                      ${isActive ? "outline outline-2 outline-blue-500 z-[2]" : ""}
                      ${isSelected && !isActive ? "bg-blue-500/15" : "bg-neutral-950"}
                    `}
                    onClick={() => handleCellClick(r, c)}
                    onDoubleClick={() => handleCellDoubleClick(r, c)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(r, c);
                    }}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className="absolute inset-0 w-full h-full bg-neutral-900 text-white px-1 outline-none border-2 border-blue-500 text-sm z-10"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                      />
                    ) : (
                      <span className="text-white block truncate leading-7">
                        {cell}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
