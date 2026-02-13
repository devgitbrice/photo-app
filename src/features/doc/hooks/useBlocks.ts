import { useState, useRef, useCallback, useEffect } from "react";
import { DocBlock } from "../types";

export const SEPARATOR = "||BLOCK||";
const OLD_SEP = "<" + "!--BLOCK_SEPARATOR--" + ">";

export function ensureHtml(raw: string): string {
  if (!raw || !raw.trim()) return "<p><br></p>";
  if (/<[a-z][\s\S]*?>/i.test(raw)) return raw;
  return raw.split("\n").map(line => (line.trim() ? `<p>${line}</p>` : "<p><br></p>")).join("");
}

export function useBlocks(initialHtml: string, onTriggerSave: () => void) {
  const [blocks, setBlocks] = useState<DocBlock[]>(() => {
    if (!initialHtml) return [{ id: crypto.randomUUID(), html: "<p><br></p>" }];
    const safeHtml = initialHtml.split(OLD_SEP).join(SEPARATOR);
    if (safeHtml.includes(SEPARATOR)) {
      return safeHtml.split(SEPARATOR).map(h => ({ id: crypto.randomUUID(), html: ensureHtml(h) }));
    }
    return [{ id: crypto.randomUUID(), html: ensureHtml(safeHtml) }];
  });

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const htmlRefs = useRef<{ [id: string]: string }>({});

  useEffect(() => {
    blocks.forEach(b => { if (htmlRefs.current[b.id] === undefined) htmlRefs.current[b.id] = b.html; });
  }, [blocks]);

  const handleHtmlChange = useCallback((id: string, newHtml: string) => {
    htmlRefs.current[id] = newHtml;
    onTriggerSave();
  }, [onTriggerSave]);

  const handleFocusChange = useCallback((id: string, html: string) => {
    htmlRefs.current[id] = html;
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, html } : b));
    setTimeout(onTriggerSave, 100);
  }, [onTriggerSave]);

  const handleAddBelow = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const nb = { id: crypto.randomUUID(), html: "<p><br></p>" };
      htmlRefs.current[nb.id] = nb.html;
      const arr = [...prev];
      arr.splice(idx + 1, 0, nb);
      return arr;
    });
    setTimeout(onTriggerSave, 100);
  }, [onTriggerSave]);

  const handleAddAtEnd = useCallback(() => {
    setBlocks(prev => {
      const nb = { id: crypto.randomUUID(), html: "<p><br></p>" };
      htmlRefs.current[nb.id] = nb.html;
      return [...prev, nb];
    });
    setTimeout(onTriggerSave, 100);
  }, [onTriggerSave]);

  const handleMoveUp = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
    setTimeout(onTriggerSave, 100);
  }, [onTriggerSave]);

  const handleMoveDown = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      return arr;
    });
    setTimeout(onTriggerSave, 100);
  }, [onTriggerSave]);

  const handleSplit = useCallback((id: string, beforeHtml: string, afterHtml: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      arr[idx] = { ...arr[idx], html: ensureHtml(beforeHtml) };
      htmlRefs.current[id] = ensureHtml(beforeHtml);
      
      const nb = { id: crypto.randomUUID(), html: ensureHtml(afterHtml) };
      htmlRefs.current[nb.id] = nb.html;
      arr.splice(idx + 1, 0, nb);
      return arr;
    });
    setTimeout(onTriggerSave, 100);
  }, [onTriggerSave]);

  return { blocks, focusedBlockId, setFocusedBlockId, htmlRefs, handleHtmlChange, handleFocusChange, handleAddBelow, handleAddAtEnd, handleMoveUp, handleMoveDown, handleSplit };
}