"use client";

import { useState, useRef } from "react";
import {
  Type, ImageIcon, Square, Smile, Table2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Columns2, Trash2, Copy, ArrowUpToLine, ArrowDownToLine,
  Palette, ChevronDown, RotateCcw,
  HardDrive, Search, Banana,
  GitBranch, Code2,
  Mic, MicOff, Loader2,
} from "lucide-react";
import type { Slide, SlideElement, ElementStyle, ShapeType, PresentationStyles } from "../types";
import {
  TEXT_PRESETS, AVAILABLE_SHAPES, AVAILABLE_ICONS, TEXT_EFFECTS, FONT_FAMILIES, CODE_LANGUAGES,
} from "../types";
import { ICON_MAP } from "./IconMap";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";

type Props = {
  slide: Slide;
  updateSlide: (s: Slide) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onNanoBanana?: () => void;
  slides?: Slide[];
  setSlides?: (s: Slide[]) => void;
  presentationStyles?: PresentationStyles;
  setPresentationStyles?: (s: PresentationStyles) => void;
};

export default function PresentationToolbar({ slide, updateSlide, selectedId, setSelectedId, onNanoBanana, slides, setSlides, presentationStyles, setPresentationStyles }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedEl = slide.elements.find((e) => e.id === selectedId);

  // Voice dictation for text elements
  const { state: dictState, toggle: toggleDictation } = useVoiceDictation((text) => {
    if (!selectedId) return;
    const el = slide.elements.find((e) => e.id === selectedId);
    if (el && (el.type === "text" || el.type === "shape")) {
      const existing = el.content || "";
      updateSlide({
        ...slide,
        elements: slide.elements.map((e) =>
          e.id === selectedId ? { ...e, content: existing + text } : e
        ),
      });
    }
  });

  // ─── Helpers ────────────────────────────────────────────────
  const addElement = (el: SlideElement) => {
    const maxZ = slide.elements.length > 0 ? Math.max(...slide.elements.map((e) => e.zIndex)) : 0;
    const newEl = { ...el, zIndex: maxZ + 1 };
    updateSlide({ ...slide, elements: [...slide.elements, newEl] });
    setSelectedId(newEl.id);
    setOpenMenu(null);
  };

  const updateElement = (updates: Partial<SlideElement>) => {
    if (!selectedId) return;
    updateSlide({
      ...slide,
      elements: slide.elements.map((e) => (e.id === selectedId ? { ...e, ...updates } : e)),
    });
  };

  const updateStyle = (updates: Partial<ElementStyle>) => {
    if (!selectedEl) return;
    updateElement({ style: { ...selectedEl.style, ...updates } });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    updateSlide({ ...slide, elements: slide.elements.filter((e) => e.id !== selectedId) });
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedEl) return;
    const dup: SlideElement = { ...selectedEl, id: crypto.randomUUID(), x: selectedEl.x + 3, y: selectedEl.y + 3 };
    addElement(dup);
  };

  const bringForward = () => {
    if (!selectedEl) return;
    const maxZ = Math.max(...slide.elements.map((e) => e.zIndex));
    updateElement({ zIndex: maxZ + 1 });
  };

  const sendBackward = () => {
    if (!selectedEl) return;
    const minZ = Math.min(...slide.elements.map((e) => e.zIndex));
    updateElement({ zIndex: Math.max(0, minZ - 1) });
  };

  // ─── Global role style helpers ─────────────────────────────
  const applyRoleStyle = (role: "title" | "body", styleUpdates: Partial<ElementStyle>) => {
    if (!slides || !setSlides) return;
    const newSlides = slides.map((s) => ({
      ...s,
      elements: s.elements.map((el) =>
        el.textRole === role ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
    }));
    setSlides(newSlides);
  };

  const assignRole = (role: "title" | "body") => {
    if (!selectedEl || !presentationStyles) return;
    const roleStyle = presentationStyles[role];
    const newRole = selectedEl.textRole === role ? undefined : role;
    if (newRole) {
      updateElement({ textRole: newRole, style: { ...selectedEl.style, fontFamily: roleStyle.fontFamily, fontSize: roleStyle.fontSize } });
    } else {
      updateElement({ textRole: undefined });
    }
  };

  // ─── Insert handlers ───────────────────────────────────────
  const addText = () => {
    addElement({
      id: crypto.randomUUID(), type: "text",
      x: 15, y: 30, width: 70, height: 20,
      rotation: 0, zIndex: 0,
      content: "Zone de texte",
      style: { fontSize: 20, color: "#333333", textAlign: "left", backgroundColor: "transparent" },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Resize image before storing
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1600;
        let w = img.width, h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = (h / w) * MAX_DIM; w = MAX_DIM; }
          else { w = (w / h) * MAX_DIM; h = MAX_DIM; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        addElement({
          id: crypto.randomUUID(), type: "image",
          x: 20, y: 15, width: 60, height: 60,
          rotation: 0, zIndex: 0,
          src: dataUrl,
          objectFit: "contain",
          style: {},
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addShape = (shapeType: ShapeType) => {
    addElement({
      id: crypto.randomUUID(), type: "shape",
      x: 30, y: 25, width: 25, height: 40,
      rotation: 0, zIndex: 0,
      shapeType,
      content: shapeType === "callout" ? "Texte" : "",
      style: { fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2, color: "#ffffff", fontSize: 14 },
    });
  };

  const addIcon = (iconName: string) => {
    addElement({
      id: crypto.randomUUID(), type: "icon",
      x: 40, y: 35, width: 12, height: 20,
      rotation: 0, zIndex: 0,
      iconName, iconSize: 64,
      style: { color: "#333333" },
    });
  };

  const addTable = (rows: number, cols: number) => {
    const data = Array.from({ length: rows }, (_, ri) =>
      Array.from({ length: cols }, (_, ci) => (ri === 0 ? `Col ${ci + 1}` : ""))
    );
    addElement({
      id: crypto.randomUUID(), type: "table",
      x: 10, y: 20, width: 80, height: 50,
      rotation: 0, zIndex: 0,
      tableData: data,
      style: { fontSize: 14, color: "#333333", backgroundColor: "#f3f4f6" },
    });
  };

  const addMindmap = () => {
    addElement({
      id: crypto.randomUUID(), type: "mindmap",
      x: 5, y: 10, width: 90, height: 75,
      rotation: 0, zIndex: 0,
      mindmapData: {
        id: crypto.randomUUID(),
        label: "Idée centrale",
        children: [
          { id: crypto.randomUUID(), label: "Branche 1", children: [] },
          { id: crypto.randomUUID(), label: "Branche 2", children: [] },
          { id: crypto.randomUUID(), label: "Branche 3", children: [] },
        ],
      },
      style: { color: "#333333" },
    });
  };

  const addCode = (language: string = "javascript") => {
    addElement({
      id: crypto.randomUUID(), type: "code",
      x: 10, y: 15, width: 80, height: 60,
      rotation: 0, zIndex: 0,
      codeContent: language === "python"
        ? 'def hello():\n    print("Hello, World!")\n\nhello()'
        : language === "html"
        ? '<div class="container">\n  <h1>Hello World</h1>\n  <p>My content here</p>\n</div>'
        : 'function hello() {\n  console.log("Hello, World!");\n}\n\nhello();',
      codeLanguage: language,
      style: { fontSize: 13 },
    });
  };

  // ─── Dropdown wrapper ──────────────────────────────────────
  const Dropdown = ({ name, children }: { name: string; children: React.ReactNode }) => (
    <div className="relative">
      {openMenu === name && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 p-2 min-w-[200px] max-h-[400px] overflow-y-auto">
            {children}
          </div>
        </>
      )}
    </div>
  );

  const Btn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? "bg-orange-600 text-white" : "hover:bg-neutral-700 text-neutral-300"}`}
    >
      {children}
    </button>
  );

  const s = selectedEl?.style || {};

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-1.5 flex items-center gap-1 flex-wrap text-sm">
      {/* ─── Insert section ──────────────────────────────── */}
      <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
        <Btn onClick={addText} title="Zone de texte"><Type size={16} /></Btn>

        <div className="relative">
          <Btn onClick={() => setOpenMenu(openMenu === "image" ? null : "image")} title="Image">
            <span className="flex items-center gap-0.5"><ImageIcon size={16} /><ChevronDown size={10} /></span>
          </Btn>
          <Dropdown name="image">
            <button
              onClick={() => { fileInputRef.current?.click(); setOpenMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded"
            >
              <HardDrive size={14} /> Image locale
            </button>
            <button
              onClick={() => {
                window.open("https://images.google.com", "_blank");
                setOpenMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded"
            >
              <Search size={14} /> Google Images
            </button>
            <button
              onClick={() => { onNanoBanana?.(); setOpenMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded"
            >
              <Banana size={14} className="text-yellow-500" /> Nano banana
              <span className="text-[10px] text-yellow-500/70 ml-auto">IA</span>
            </button>
          </Dropdown>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <div className="relative">
          <Btn onClick={() => setOpenMenu(openMenu === "shapes" ? null : "shapes")} title="Formes">
            <span className="flex items-center gap-0.5"><Square size={16} /><ChevronDown size={10} /></span>
          </Btn>
          <Dropdown name="shapes">
            <div className="grid grid-cols-3 gap-1">
              {AVAILABLE_SHAPES.map((sh) => (
                <button key={sh.type} onClick={() => { addShape(sh.type); setOpenMenu(null); }}
                  className="px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 rounded truncate">
                  {sh.label}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <div className="relative">
          <Btn onClick={() => setOpenMenu(openMenu === "icons" ? null : "icons")} title="Icônes">
            <span className="flex items-center gap-0.5"><Smile size={16} /><ChevronDown size={10} /></span>
          </Btn>
          <Dropdown name="icons">
            <div className="grid grid-cols-6 gap-1">
              {AVAILABLE_ICONS.map((name) => {
                const IC = ICON_MAP[name];
                return IC ? (
                  <button key={name} onClick={() => { addIcon(name); setOpenMenu(null); }}
                    className="p-2 hover:bg-neutral-700 rounded flex items-center justify-center" title={name}>
                    <IC size={18} className="text-neutral-300" />
                  </button>
                ) : null;
              })}
            </div>
          </Dropdown>
        </div>

        <div className="relative">
          <Btn onClick={() => setOpenMenu(openMenu === "table" ? null : "table")} title="Tableau">
            <span className="flex items-center gap-0.5"><Table2 size={16} /><ChevronDown size={10} /></span>
          </Btn>
          <Dropdown name="table">
            <button onClick={() => { addTable(3, 3); setOpenMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 rounded mb-1">
              Tableau 3×3 (défaut)
            </button>
            <p className="text-xs text-neutral-400 mb-2 px-1">Ou choisir une taille :</p>
            <div className="grid grid-cols-5 gap-1">
              {[2, 3, 4, 5, 6].map((r) =>
                [2, 3, 4, 5].map((c) => (
                  <button key={`${r}x${c}`} onClick={() => { addTable(r, c); setOpenMenu(null); }}
                    className="px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 rounded">
                    {r}×{c}
                  </button>
                ))
              )}
            </div>
            <p className="text-[10px] text-neutral-500 mt-2 px-1">Formules : =SUM(A1:A3), =A1+B1, =AVG, =MIN, =MAX</p>
          </Dropdown>
        </div>

        <Btn onClick={addMindmap} title="Mindmap">
          <GitBranch size={16} />
        </Btn>

        <div className="relative">
          <Btn onClick={() => setOpenMenu(openMenu === "code" ? null : "code")} title="Code">
            <span className="flex items-center gap-0.5"><Code2 size={16} /><ChevronDown size={10} /></span>
          </Btn>
          <Dropdown name="code">
            <p className="text-xs text-neutral-400 mb-2 px-1">Langage</p>
            <div className="grid grid-cols-2 gap-1 max-h-[300px] overflow-y-auto">
              {CODE_LANGUAGES.map((lang) => (
                <button key={lang} onClick={() => { addCode(lang); setOpenMenu(null); }}
                  className="px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 rounded text-left">
                  {lang}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        {/* Voice dictation button */}
        <button
          onClick={toggleDictation}
          title={dictState === "recording" ? "Arreter la dictee" : "Dictee vocale (Gemini)"}
          disabled={!selectedEl || (selectedEl.type !== "text" && selectedEl.type !== "shape")}
          className={`p-1.5 rounded transition-all ${
            dictState === "recording"
              ? "bg-red-600 text-white animate-pulse"
              : dictState === "connecting"
              ? "bg-yellow-600 text-white"
              : selectedEl && (selectedEl.type === "text" || selectedEl.type === "shape")
              ? "hover:bg-neutral-700 text-neutral-300"
              : "text-neutral-600 cursor-not-allowed"
          }`}
        >
          {dictState === "connecting" ? <Loader2 size={16} className="animate-spin" /> : dictState === "recording" ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>

      {/* ─── Format section (when element selected) ──────── */}
      {selectedEl && (
        <>
          {/* Text formatting */}
          {(selectedEl.type === "text" || selectedEl.type === "table" || selectedEl.type === "shape") && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              {/* Font family */}
              <select
                value={s.fontFamily || "Arial"}
                onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 max-w-[100px]"
              >
                {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Font size */}
              <input
                type="number"
                value={s.fontSize || 18}
                onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-12"
                min={8} max={120}
              />

              <Btn onClick={() => updateStyle({ fontWeight: s.fontWeight === "bold" ? "normal" : "bold" })}
                active={s.fontWeight === "bold"} title="Gras">
                <Bold size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ fontStyle: s.fontStyle === "italic" ? "normal" : "italic" })}
                active={s.fontStyle === "italic"} title="Italique">
                <Italic size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ textDecoration: s.textDecoration === "underline" ? "none" : "underline" })}
                active={s.textDecoration === "underline"} title="Souligné">
                <Underline size={14} />
              </Btn>

              {/* Text color */}
              <label className="relative cursor-pointer" title="Couleur du texte">
                <div className="p-1.5 hover:bg-neutral-700 rounded">
                  <Type size={14} className="text-neutral-300" />
                  <div className="h-0.5 w-full rounded" style={{ backgroundColor: s.color || "#333" }} />
                </div>
                <input type="color" value={s.color || "#333333"}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>

              {/* Background color */}
              <label className="relative cursor-pointer" title="Couleur de fond">
                <div className="p-1.5 hover:bg-neutral-700 rounded">
                  <Palette size={14} className="text-neutral-300" />
                </div>
                <input type="color" value={s.backgroundColor || "#ffffff"}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
            </div>
          )}

          {/* Alignment & lists */}
          {selectedEl.type === "text" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <Btn onClick={() => updateStyle({ textAlign: "left" })} active={s.textAlign === "left"} title="Gauche">
                <AlignLeft size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ textAlign: "center" })} active={s.textAlign === "center"} title="Centré">
                <AlignCenter size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ textAlign: "right" })} active={s.textAlign === "right"} title="Droite">
                <AlignRight size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ textAlign: "justify" })} active={s.textAlign === "justify"} title="Justifié">
                <AlignJustify size={14} />
              </Btn>

              <span className="w-px h-4 bg-neutral-700 mx-1" />

              <Btn onClick={() => updateStyle({ listStyle: s.listStyle === "disc" ? "none" : "disc" })}
                active={s.listStyle === "disc"} title="Puces">
                <List size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ listStyle: s.listStyle === "decimal" ? "none" : "decimal" })}
                active={s.listStyle === "decimal"} title="Numérotation">
                <ListOrdered size={14} />
              </Btn>
              <Btn onClick={() => updateStyle({ columns: (s.columns || 1) >= 3 ? 1 : (s.columns || 1) + 1 })}
                active={(s.columns || 1) > 1} title={`Colonnes: ${s.columns || 1}`}>
                <Columns2 size={14} />
              </Btn>

              {/* Line height */}
              <select
                value={s.lineHeight || 1.4}
                onChange={(e) => updateStyle({ lineHeight: Number(e.target.value) })}
                className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-14"
                title="Interligne"
              >
                {[1, 1.2, 1.4, 1.6, 1.8, 2, 2.5].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}

          {/* Titre / Corps role buttons + Effects */}
          {selectedEl.type === "text" && presentationStyles && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              {/* Titre */}
              <button
                onClick={() => assignRole("title")}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedEl.textRole === "title"
                    ? "bg-orange-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
                title="Attribuer le style Titre"
              >
                Titre
              </button>
              <select
                value={presentationStyles.title.fontFamily}
                onChange={(e) => {
                  const val = e.target.value;
                  setPresentationStyles?.({ ...presentationStyles, title: { ...presentationStyles.title, fontFamily: val } });
                  applyRoleStyle("title", { fontFamily: val });
                }}
                className="bg-neutral-800 text-neutral-300 text-[11px] rounded px-1 py-0.5 border border-neutral-700 max-w-[80px]"
                title="Police des titres"
              >
                {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <input
                type="number"
                value={presentationStyles.title.fontSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPresentationStyles?.({ ...presentationStyles, title: { ...presentationStyles.title, fontSize: val } });
                  applyRoleStyle("title", { fontSize: val });
                }}
                className="bg-neutral-800 text-neutral-300 text-[11px] rounded px-1 py-0.5 border border-neutral-700 w-10"
                min={8} max={120}
                title="Taille des titres"
              />

              <span className="w-px h-4 bg-neutral-700 mx-1" />

              {/* Corps */}
              <button
                onClick={() => assignRole("body")}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedEl.textRole === "body"
                    ? "bg-orange-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
                title="Attribuer le style Corps"
              >
                Corps
              </button>
              <select
                value={presentationStyles.body.fontFamily}
                onChange={(e) => {
                  const val = e.target.value;
                  setPresentationStyles?.({ ...presentationStyles, body: { ...presentationStyles.body, fontFamily: val } });
                  applyRoleStyle("body", { fontFamily: val });
                }}
                className="bg-neutral-800 text-neutral-300 text-[11px] rounded px-1 py-0.5 border border-neutral-700 max-w-[80px]"
                title="Police du corps"
              >
                {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <input
                type="number"
                value={presentationStyles.body.fontSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPresentationStyles?.({ ...presentationStyles, body: { ...presentationStyles.body, fontSize: val } });
                  applyRoleStyle("body", { fontSize: val });
                }}
                className="bg-neutral-800 text-neutral-300 text-[11px] rounded px-1 py-0.5 border border-neutral-700 w-10"
                min={8} max={120}
                title="Taille du corps"
              />

              <span className="w-px h-4 bg-neutral-700 mx-1" />

              {/* Effects dropdown */}
              <div className="relative">
                <Btn onClick={() => setOpenMenu(openMenu === "effects" ? null : "effects")} title="Effets de texte">
                  <span className="flex items-center gap-0.5 text-xs">Effets<ChevronDown size={10} /></span>
                </Btn>
                <Dropdown name="effects">
                  {TEXT_EFFECTS.map((fx) => (
                    <button key={fx.name} onClick={() => {
                      updateStyle({
                        textShadow: fx.shadow === "none" ? undefined : fx.shadow,
                        WebkitTextStroke: fx.stroke || undefined,
                      });
                      setOpenMenu(null);
                    }}
                      className="w-full text-left px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 rounded">
                      {fx.name}
                    </button>
                  ))}
                </Dropdown>
              </div>
            </div>
          )}

          {/* Image controls */}
          {selectedEl.type === "image" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <select
                value={selectedEl.objectFit || "contain"}
                onChange={(e) => updateElement({ objectFit: e.target.value as "cover" | "contain" | "fill" })}
                className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700"
                title="Mode d'affichage"
              >
                <option value="contain">Contenir</option>
                <option value="cover">Couvrir</option>
                <option value="fill">Remplir</option>
              </select>
              <label className="text-xs text-neutral-400 flex items-center gap-1" title="Arrondi">
                R:
                <input type="number" value={s.borderRadius || 0} min={0} max={50}
                  onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })}
                  className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-12" />
              </label>
              <label className="text-xs text-neutral-400 flex items-center gap-1" title="Opacité">
                Op:
                <input type="range" value={(s.opacity ?? 1) * 100} min={0} max={100}
                  onChange={(e) => updateStyle({ opacity: Number(e.target.value) / 100 })}
                  className="w-16 accent-orange-500" />
              </label>
            </div>
          )}

          {/* Shape controls */}
          {selectedEl.type === "shape" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <label className="relative cursor-pointer" title="Couleur de remplissage">
                <div className="p-1 hover:bg-neutral-700 rounded text-xs text-neutral-400">Fond</div>
                <input type="color" value={s.fill || "#3b82f6"}
                  onChange={(e) => updateStyle({ fill: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <label className="relative cursor-pointer" title="Couleur du contour">
                <div className="p-1 hover:bg-neutral-700 rounded text-xs text-neutral-400">Contour</div>
                <input type="color" value={s.stroke || "#1d4ed8"}
                  onChange={(e) => updateStyle({ stroke: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <label className="text-xs text-neutral-400 flex items-center gap-1">
                Ép:
                <input type="number" value={s.strokeWidth || 2} min={0} max={20}
                  onChange={(e) => updateStyle({ strokeWidth: Number(e.target.value) })}
                  className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-10" />
              </label>
            </div>
          )}

          {/* Icon controls */}
          {selectedEl.type === "icon" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <label className="relative cursor-pointer" title="Couleur">
                <div className="p-1 hover:bg-neutral-700 rounded text-xs text-neutral-400">Couleur</div>
                <input type="color" value={s.color || "#333333"}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <label className="text-xs text-neutral-400 flex items-center gap-1">
                Taille:
                <input type="number" value={selectedEl.iconSize || 64} min={16} max={256}
                  onChange={(e) => updateElement({ iconSize: Number(e.target.value) })}
                  className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-14" />
              </label>
            </div>
          )}

          {/* Table controls */}
          {selectedEl.type === "table" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <button onClick={() => {
                const data = selectedEl.tableData || [[""]];
                updateElement({ tableData: [...data, Array(data[0].length).fill("")] });
              }} className="text-xs text-neutral-300 hover:bg-neutral-700 px-2 py-1 rounded">
                + Ligne
              </button>
              <button onClick={() => {
                const data = selectedEl.tableData || [[""]];
                updateElement({ tableData: data.map((r) => [...r, ""]) });
              }} className="text-xs text-neutral-300 hover:bg-neutral-700 px-2 py-1 rounded">
                + Colonne
              </button>
              <button onClick={() => {
                const data = selectedEl.tableData || [[""]];
                if (data.length > 1) updateElement({ tableData: data.slice(0, -1) });
              }} className="text-xs text-neutral-300 hover:bg-neutral-700 px-2 py-1 rounded">
                - Ligne
              </button>
              <button onClick={() => {
                const data = selectedEl.tableData || [[""]];
                if (data[0].length > 1) updateElement({ tableData: data.map((r) => r.slice(0, -1)) });
              }} className="text-xs text-neutral-300 hover:bg-neutral-700 px-2 py-1 rounded">
                - Colonne
              </button>
            </div>
          )}

          {/* Mindmap controls */}
          {selectedEl.type === "mindmap" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <span className="text-xs text-neutral-500">Mindmap</span>
              <button onClick={() => {
                const root = selectedEl.mindmapData;
                if (!root) return;
                updateElement({
                  mindmapData: {
                    ...root,
                    children: [...root.children, { id: crypto.randomUUID(), label: "Nouveau", children: [] }],
                  },
                });
              }} className="text-xs text-neutral-300 hover:bg-neutral-700 px-2 py-1 rounded">
                + Branche
              </button>
              {/* Background color */}
              <label className="relative cursor-pointer" title="Couleur de fond">
                <div className="p-1 hover:bg-neutral-700 rounded text-xs text-neutral-400">Fond</div>
                <input type="color" value={s.backgroundColor || "#ffffff"}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
            </div>
          )}

          {/* Code controls */}
          {selectedEl.type === "code" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <select
                value={selectedEl.codeLanguage || "javascript"}
                onChange={(e) => updateElement({ codeLanguage: e.target.value })}
                className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 max-w-[120px]"
                title="Langage"
              >
                {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <label className="text-xs text-neutral-400 flex items-center gap-1">
                Taille:
                <input type="number" value={s.fontSize || 13} min={8} max={30}
                  onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                  className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-12" />
              </label>
            </div>
          )}

          {/* ─── Common actions ────────────────────────────── */}
          <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
            <Btn onClick={bringForward} title="Avancer"><ArrowUpToLine size={14} /></Btn>
            <Btn onClick={sendBackward} title="Reculer"><ArrowDownToLine size={14} /></Btn>
            <Btn onClick={duplicateSelected} title="Dupliquer"><Copy size={14} /></Btn>

            {/* Rotation */}
            <label className="text-xs text-neutral-400 flex items-center gap-1" title="Rotation">
              <RotateCcw size={12} />
              <input type="number" value={selectedEl.rotation || 0} min={-360} max={360} step={15}
                onChange={(e) => updateElement({ rotation: Number(e.target.value) })}
                className="bg-neutral-800 text-neutral-300 text-xs rounded px-1 py-1 border border-neutral-700 w-12" />
              °
            </label>

            <Btn onClick={deleteSelected} title="Supprimer">
              <Trash2 size={14} className="text-red-400" />
            </Btn>
          </div>

          {/* Slide background color */}
          <div className="flex items-center gap-1">
            <label className="relative cursor-pointer flex items-center gap-1" title="Fond de la diapositive">
              <span className="text-xs text-neutral-500">Fond:</span>
              <div className="w-5 h-5 rounded border border-neutral-600" style={{ backgroundColor: slide.backgroundColor || "#ffffff" }} />
              <input type="color" value={slide.backgroundColor || "#ffffff"}
                onChange={(e) => updateSlide({ ...slide, backgroundColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>
          </div>
        </>
      )}

      {/* Slide background if no element selected */}
      {!selectedEl && (
        <label className="relative cursor-pointer flex items-center gap-1 ml-auto" title="Fond de la diapositive">
          <span className="text-xs text-neutral-500">Fond de diapositive:</span>
          <div className="w-5 h-5 rounded border border-neutral-600" style={{ backgroundColor: slide.backgroundColor || "#ffffff" }} />
          <input type="color" value={slide.backgroundColor || "#ffffff"}
            onChange={(e) => updateSlide({ ...slide, backgroundColor: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>
      )}
    </div>
  );
}
