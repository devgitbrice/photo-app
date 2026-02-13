"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { updateDriveItemAction } from "@/features/mydrive/modify";
import TagSelector from "@/features/mydrive/components/TagSelector";
import type { Tag } from "@/features/mydrive/types";

interface DocEditorProps {
  allTags: Tag[];
  initialData: {
    id: string;
    title: string;
    content: string;
    observation: string;
    tags: Tag[];
  };
}

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/** If content has no HTML tags, treat it as plain text and convert newlines. */
function ensureHtml(raw: string): string {
  if (!raw || !raw.trim()) return "<p><br></p>";
  // Already contains HTML tags → use as-is
  if (/<[a-z][\s\S]*?>/i.test(raw)) return raw;
  // Plain text → wrap each line in <p>, empty lines become <p><br></p>
  return raw
    .split("\n")
    .map((line) => (line.trim() ? `<p>${line}</p>` : "<p><br></p>"))
    .join("");
}

export default function DocEditor({ allTags: initialAllTags, initialData }: DocEditorProps) {
  const [title, setTitle] = useState(initialData.title);
  const [observation, setObservation] = useState(initialData.observation);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData.tags);
  const [allTags, setAllTags] = useState<Tag[]>(initialAllTags);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [tocOpen, setTocOpen] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(initialData.content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Extract headings from editor for TOC ---
  const updateToc = useCallback(() => {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll("h1, h2, h3");
    const entries: TocEntry[] = [];
    headings.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl.id) htmlEl.id = `toc-heading-${i}`;
      const text = htmlEl.textContent?.trim() || "";
      if (text) {
        entries.push({ id: htmlEl.id, text, level: parseInt(htmlEl.tagName[1]) });
      }
    });
    setTocEntries(entries);
  }, []);

  // --- Initialise contentEditable on mount ---
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = ensureHtml(initialData.content);
    }
    // Ensure Enter creates <p> tags consistently across browsers
    document.execCommand("defaultParagraphSeparator", false, "p");
    // Build initial TOC
    setTimeout(updateToc, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- AUTO-SAVE (debounce 1s) ---
  const autoSave = useCallback(async (t: string, c: string, o: string) => {
    if (!t.trim()) return;
    setStatus("saving");
    try {
      await updateDriveItemAction(initialData.id, {
        title: t.trim(),
        content: c,
        observation: o,
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("idle");
    }
  }, [initialData.id]);

  const scheduleAutoSave = useCallback((t: string, c: string, o: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(t, c, o), 1000);
  }, [autoSave]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleAutoSave(val, contentRef.current, observation);
  };

  const handleObservationChange = (val: string) => {
    setObservation(val);
    scheduleAutoSave(title, contentRef.current, val);
  };

  // --- RIBBON (execCommand) ---
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setTimeout(() => {
      const html = editorRef.current?.innerHTML || "";
      contentRef.current = html;
      scheduleAutoSave(title, html, observation);
      updateToc();
    }, 50);
  };

  const handleEditorInput = () => {
    const html = editorRef.current?.innerHTML || "";
    contentRef.current = html;
    scheduleAutoSave(title, html, observation);
    updateToc();
  };

  // --- Stable ref for exec (used in keyboard shortcut effect) ---
  const execRef = useRef(exec);
  execRef.current = exec;

  // --- KEYBOARD SHORTCUTS: Cmd+Option+1/2/3 for H1/H2/H3 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey) {
        const map: Record<string, string> = { Digit1: "h1", Digit2: "h2", Digit3: "h3" };
        const tag = map[e.code];
        if (tag) {
          e.preventDefault();
          execRef.current("formatBlock", tag);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- TOC click → scroll to heading ---
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- TAG HANDLERS ---
  const handleTagsChange = (_itemId: string, newTags: Tag[]) => setSelectedTags(newTags);
  const handleNewTagCreated = (tag: Tag) => {
    setAllTags((prev) => {
      if (prev.some((t) => t.id === tag.id)) return prev;
      return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const ribbonGroups = [
    {
      buttons: [
        { icon: "B", title: "Gras", action: () => exec("bold"), cls: "font-bold" },
        { icon: "I", title: "Italique", action: () => exec("italic"), cls: "italic" },
        { icon: "U", title: "Souligné", action: () => exec("underline"), cls: "underline" },
        { icon: "S", title: "Barré", action: () => exec("strikeThrough"), cls: "line-through" },
      ],
    },
    {
      buttons: [
        { icon: "H1", title: "Titre 1", action: () => exec("formatBlock", "h1"), cls: "" },
        { icon: "H2", title: "Titre 2", action: () => exec("formatBlock", "h2"), cls: "" },
        { icon: "H3", title: "Titre 3", action: () => exec("formatBlock", "h3"), cls: "" },
        { icon: "P", title: "Paragraphe", action: () => exec("formatBlock", "p"), cls: "" },
      ],
    },
    {
      buttons: [
        { icon: "\u2022", title: "Liste à puces", action: () => exec("insertUnorderedList"), cls: "" },
        { icon: "1.", title: "Liste numérotée", action: () => exec("insertOrderedList"), cls: "" },
      ],
    },
    {
      buttons: [
        { icon: "\u2261", title: "Gauche", action: () => exec("justifyLeft"), cls: "" },
        { icon: "\u2263", title: "Centre", action: () => exec("justifyCenter"), cls: "" },
        { icon: "\u2262", title: "Droite", action: () => exec("justifyRight"), cls: "" },
      ],
    },
    {
      buttons: [
        { icon: "\u2015", title: "Ligne", action: () => exec("insertHorizontalRule"), cls: "" },
        { icon: "\u201C", title: "Citation", action: () => exec("formatBlock", "blockquote"), cls: "" },
        { icon: "</>", title: "Code", action: () => exec("formatBlock", "pre"), cls: "" },
      ],
    },
    {
      buttons: [
        { icon: "\u21B6", title: "Annuler", action: () => exec("undo"), cls: "" },
        { icon: "\u21B7", title: "Rétablir", action: () => exec("redo"), cls: "" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden">
      {/* HEADER */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-3 flex items-center gap-3">
        <Link href="/mydrive" className="text-neutral-400 hover:text-white transition-colors p-2 bg-neutral-800 rounded-lg shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Titre du document..."
          className="flex-1 bg-transparent text-xl font-bold text-white placeholder-neutral-600 outline-none"
        />

        <span className={`text-xs px-2 py-1 rounded-full transition-all shrink-0 ${
          status === "saving" ? "bg-yellow-600/20 text-yellow-400" :
          status === "saved" ? "bg-green-600/20 text-green-400" :
          "bg-neutral-800 text-neutral-500"
        }`}>
          {status === "saving" ? "Sauvegarde..." : status === "saved" ? "Enregistré" : "Auto-save"}
        </span>
      </div>

      {/* DESCRIPTION */}
      <div className="bg-neutral-900/50 border-b border-neutral-800 px-4 py-2">
        <input
          type="text"
          value={observation}
          onChange={(e) => handleObservationChange(e.target.value)}
          placeholder="Description / observation..."
          className="w-full bg-transparent text-sm text-neutral-400 placeholder-neutral-700 outline-none"
        />
      </div>

      {/* RIBBON */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {/* TOC toggle */}
          <button
            onClick={() => setTocOpen((v) => !v)}
            title={tocOpen ? "Masquer le plan" : "Afficher le plan"}
            className={`px-2.5 py-1.5 text-sm rounded hover:bg-neutral-700 transition-colors ${
              tocOpen && tocEntries.length > 0 ? "text-blue-400 bg-neutral-800" : "text-neutral-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </button>
          <div className="w-px h-6 bg-neutral-700 mx-1.5" />
          {ribbonGroups.map((group, gi) => (
            <div key={gi} className="flex items-center">
              {gi > 0 && <div className="w-px h-6 bg-neutral-700 mx-1.5" />}
              <div className="flex items-center gap-0.5">
                {group.buttons.map((btn, bi) => (
                  <button
                    key={bi}
                    onClick={btn.action}
                    title={btn.title}
                    className={`px-2.5 py-1.5 text-sm rounded hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors ${btn.cls || ""}`}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="w-px h-6 bg-neutral-700 mx-1.5" />
          <label title="Couleur du texte" className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-700 transition-colors">
            <span className="text-sm text-neutral-300">A</span>
            <input type="color" defaultValue="#ffffff" onChange={(e) => exec("foreColor", e.target.value)} className="w-4 h-4 border-0 bg-transparent cursor-pointer" />
          </label>
          <label title="Surligner" className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-700 transition-colors">
            <span className="text-sm text-neutral-300 bg-yellow-400/30 px-1 rounded">A</span>
            <input type="color" defaultValue="#000000" onChange={(e) => exec("hiliteColor", e.target.value)} className="w-4 h-4 border-0 bg-transparent cursor-pointer" />
          </label>
        </div>
      </div>

      {/* EDITOR AREA (TOC + CONTENT) */}
      <div className="flex-1 overflow-hidden flex bg-neutral-950">
        {/* TOC SIDEBAR — sticky, always visible */}
        {tocOpen && tocEntries.length > 0 && (
          <aside className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-900/50 overflow-y-auto">
            <div className="p-3">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Plan</div>
              <nav className="space-y-0.5">
                {tocEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => scrollToHeading(entry.id)}
                    className={`block w-full text-left truncate rounded px-2 py-1 hover:bg-neutral-800 transition-colors ${
                      entry.level === 1
                        ? "text-sm text-white font-semibold"
                        : entry.level === 2
                          ? "text-sm text-neutral-300 pl-4"
                          : "text-xs text-neutral-400 pl-6"
                    }`}
                    title={entry.text}
                  >
                    {entry.text}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* EDITOR CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              className="min-h-[60vh] text-white text-base leading-relaxed outline-none
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5
                [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
                [&_p]:mb-3
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
                [&_li]:mb-1
                [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-400 [&_blockquote]:my-4
                [&_pre]:bg-neutral-900 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4
                [&_hr]:border-neutral-700 [&_hr]:my-6
              "
            />
          </div>
        </div>
      </div>

      {/* TAGS */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest shrink-0">Tags :</span>
          <div className="flex-1 overflow-x-auto">
            <TagSelector
              itemId={initialData.id}
              itemTags={selectedTags}
              allTags={allTags}
              onTagsChange={handleTagsChange}
              onNewTagCreated={handleNewTagCreated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
