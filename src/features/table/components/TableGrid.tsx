"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { computeCell, isFormula, indexToCol } from "../engine/formula";

function colLabel(index: number): string {
  return indexToCol(index);
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
  const [selection, setSelection] = useState<{
    start: { r: number; c: number };
    end: { r: number; c: number };
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Formula mode: when user is typing a formula and clicks a cell to insert a reference
  const [formulaMode, setFormulaMode] = useState(false);
  // Track cursor position in formula input for inserting references
  const [formulaCursor, setFormulaCursor] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const formulaBarRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Compute display values (memoized)
  const displayData = useMemo(() => {
    return data.map((row, r) =>
      row.map((_, c) => computeCell(r, c, data))
    );
  }, [data]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Check if we're in formula editing mode
  const isInFormulaMode = useCallback(
    (value: string) => value.startsWith("="),
    []
  );

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const newData = data.map((row) => [...row]);
    newData[editingCell.r][editingCell.c] = editValue;
    setData(newData);
    setEditingCell(null);
    setFormulaMode(false);
    setFormulaCursor(null);
  }, [editingCell, editValue, data, setData]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
    setFormulaMode(false);
    setFormulaCursor(null);
  }, []);

  const startEdit = useCallback(
    (r: number, c: number, initialValue?: string) => {
      const val = initialValue !== undefined ? initialValue : data[r][c] || "";
      setActiveCell({ r, c });
      setEditingCell({ r, c });
      setEditValue(val);
      setFormulaMode(val.startsWith("="));
    },
    [data]
  );

  // When in formula mode and user clicks a cell, insert the cell reference
  const handleCellClickForFormula = useCallback(
    (r: number, c: number) => {
      const ref = colLabel(c) + (r + 1);
      const cursor = formulaCursor ?? editValue.length;
      const newValue = editValue.slice(0, cursor) + ref + editValue.slice(cursor);
      setEditValue(newValue);
      setFormulaCursor(cursor + ref.length);
      // Refocus the input
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [editValue, formulaCursor]
  );

  const handleCellClick = (r: number, c: number) => {
    // If we're in formula mode editing, clicking a cell inserts a reference
    if (editingCell && formulaMode) {
      handleCellClickForFormula(r, c);
      return;
    }

    if (editingCell) commitEdit();
    setActiveCell({ r, c });
    setSelection({ start: { r, c }, end: { r, c } });
    setEditingCell(null);
    setFormulaMode(false);
  };

  const handleCellDoubleClick = (r: number, c: number) => {
    if (editingCell && formulaMode) return; // Don't break formula mode
    startEdit(r, c);
  };

  const handleMouseDown = (r: number, c: number) => {
    if (editingCell && formulaMode) {
      // In formula mode, mouse click inserts reference, don't start selection
      handleCellClickForFormula(r, c);
      return;
    }
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

  // Update editValue and check formula mode
  const handleEditChange = useCallback(
    (val: string) => {
      setEditValue(val);
      setFormulaMode(val.startsWith("="));
    },
    []
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) {
        if (e.key === "Enter") {
          e.preventDefault();
          commitEdit();
          const nextR = Math.min(editingCell.r + 1, rows - 1);
          setActiveCell({ r: nextR, c: editingCell.c });
          setSelection({
            start: { r: nextR, c: editingCell.c },
            end: { r: nextR, c: editingCell.c },
          });
        } else if (e.key === "Tab") {
          e.preventDefault();
          commitEdit();
          const nextC = e.shiftKey
            ? Math.max(editingCell.c - 1, 0)
            : Math.min(editingCell.c + 1, cols - 1);
          setActiveCell({ r: editingCell.r, c: nextC });
          setSelection({
            start: { r: editingCell.r, c: nextC },
            end: { r: editingCell.r, c: nextC },
          });
        } else if (e.key === "Escape") {
          cancelEdit();
        }
        return;
      }

      if (!activeCell) return;
      const { r, c } = activeCell;

      // Enter → edit
      if (e.key === "Enter") {
        e.preventDefault();
        startEdit(r, c);
        return;
      }

      // F2 → edit
      if (e.key === "F2") {
        e.preventDefault();
        startEdit(r, c);
        return;
      }

      // Delete / Backspace → clear selection
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
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

      // Arrow navigation
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
          // Start typing → enter edit mode (overwrite)
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            startEdit(r, c, e.key);
            return;
          }
          return;
      }

      setActiveCell({ r: newR, c: newC });
      if (
        e.shiftKey &&
        (e.key.startsWith("Arrow") || e.key === "Tab")
      ) {
        setSelection((prev) =>
          prev
            ? { start: prev.start, end: { r: newR, c: newC } }
            : { start: { r: newR, c: newC }, end: { r: newR, c: newC } }
        );
      } else {
        setSelection({
          start: { r: newR, c: newC },
          end: { r: newR, c: newC },
        });
      }
    },
    [
      activeCell,
      editingCell,
      data,
      rows,
      cols,
      selection,
      commitEdit,
      cancelEdit,
      startEdit,
      setData,
    ]
  );

  // Copy/Paste
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (!selection || editingCell) return;
      e.preventDefault();
      const minR = Math.min(selection.start.r, selection.end.r);
      const maxR = Math.max(selection.start.r, selection.end.r);
      const minC = Math.min(selection.start.c, selection.end.c);
      const maxC = Math.max(selection.start.c, selection.end.c);
      const text = displayData
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
      for (
        let ri = 0;
        ri < pastedRows.length && activeCell.r + ri < rows;
        ri++
      ) {
        for (
          let ci = 0;
          ci < pastedRows[ri].length && activeCell.c + ci < cols;
          ci++
        ) {
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
  }, [selection, activeCell, editingCell, data, displayData, rows, cols, setData]);

  // Active cell info for formula bar
  const activeCellLabel = activeCell
    ? colLabel(activeCell.c) + (activeCell.r + 1)
    : "";
  const activeCellRaw = activeCell ? data[activeCell.r]?.[activeCell.c] ?? "" : "";

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* ─── Formula bar ─── */}
      <div className="flex items-center bg-neutral-800 border-b border-neutral-700 h-8 flex-shrink-0">
        {/* Cell name */}
        <div className="w-20 text-center text-xs font-bold text-neutral-300 border-r border-neutral-700 h-full flex items-center justify-center bg-neutral-850 select-none">
          {activeCellLabel}
        </div>
        {/* fx label */}
        <div className="px-2 text-neutral-500 text-sm font-semibold italic select-none">
          fx
        </div>
        {/* Formula / value display */}
        <input
          ref={formulaBarRef}
          className="flex-1 bg-neutral-900 text-white text-sm px-2 h-full outline-none border-none"
          value={editingCell ? editValue : activeCellRaw}
          onChange={(e) => {
            if (editingCell) {
              handleEditChange(e.target.value);
            }
          }}
          onFocus={() => {
            if (!editingCell && activeCell) {
              startEdit(activeCell.r, activeCell.c);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
              tableRef.current?.focus();
            } else if (e.key === "Escape") {
              cancelEdit();
              tableRef.current?.focus();
            }
          }}
          readOnly={!editingCell}
        />
      </div>

      {/* ─── Grid ─── */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <table
          className="border-collapse w-full"
          style={{ minWidth: cols * 100 }}
        >
          <thead className="sticky top-0 z-10">
            <tr>
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
                <th className="bg-neutral-800 border border-neutral-600 px-2 py-1 text-xs font-semibold text-neutral-400 text-center w-12 min-w-12 sticky left-0 z-[5]">
                  {r + 1}
                </th>
                {row.map((cell, c) => {
                  const isActive =
                    activeCell?.r === r && activeCell?.c === c;
                  const isEditing =
                    editingCell?.r === r && editingCell?.c === c;
                  const isSelected = isInSelection(r, c);
                  const display = displayData[r][c];
                  const hasFormula = isFormula(cell);
                  const hasError = hasFormula && display.startsWith("#");

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
                          className={`absolute inset-0 w-full h-full px-1 outline-none border-2 text-sm z-10 ${
                            formulaMode
                              ? "bg-blue-950/50 text-blue-200 border-blue-400"
                              : "bg-neutral-900 text-white border-blue-500"
                          }`}
                          value={editValue}
                          onChange={(e) => handleEditChange(e.target.value)}
                          onBlur={() => {
                            // Small delay to allow formula cell clicks to register
                            setTimeout(() => {
                              if (editingCell) commitEdit();
                            }, 150);
                          }}
                          onSelect={(e) => {
                            if (formulaMode) {
                              setFormulaCursor(
                                (e.target as HTMLInputElement).selectionStart
                              );
                            }
                          }}
                        />
                      ) : (
                        <span
                          className={`block truncate leading-7 ${
                            hasError
                              ? "text-red-400 text-xs font-semibold"
                              : hasFormula
                                ? "text-emerald-300"
                                : typeof cell === "string" && cell !== "" && !isNaN(Number(cell))
                                  ? "text-white text-right"
                                  : "text-white"
                          }`}
                          style={
                            typeof cell === "string" && cell !== "" && !isNaN(Number(cell))
                              ? { textAlign: "right" }
                              : undefined
                          }
                        >
                          {display}
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
    </div>
  );
}
