"use client";

import { useState, useRef } from "react";
import {
  Type, ImageIcon, Square, Smile, Table2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Columns2, Trash2, Copy, ArrowUpToLine, ArrowDownToLine,
  Palette, ChevronDown, RotateCcw,
  HardDrive, Search, Banana,
} from "lucide-react";
import type { Slide, SlideElement, ElementStyle, ShapeType } from "../types";
import {
  TEXT_PRESETS, AVAILABLE_SHAPES, AVAILABLE_ICONS, TEXT_EFFECTS, FONT_FAMILIES,
} from "../types";
import { ICON_MAP } from "./IconMap";

type Props = {
  slide: Slide;
  updateSlide: (s: Slide) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
};

export default function PresentationToolbar({ slide, updateSlide, selectedId, setSelectedId }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedEl = slide.elements.find((e) => e.id === selectedId);

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
              disabled
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 rounded cursor-not-allowed"
            >
              <Banana size={14} /> Nano banana
              <span className="text-[10px] text-neutral-600 ml-auto">bientot</span>
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
            <p className="text-xs text-neutral-400 mb-2 px-1">Taille du tableau</p>
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
          </Dropdown>
        </div>
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

          {/* Text styles presets */}
          {selectedEl.type === "text" && (
            <div className="flex items-center gap-1 border-r border-neutral-700 pr-3 mr-2">
              <div className="relative">
                <Btn onClick={() => setOpenMenu(openMenu === "presets" ? null : "presets")} title="Styles prédéfinis">
                  <span className="flex items-center gap-0.5 text-xs">Style<ChevronDown size={10} /></span>
                </Btn>
                <Dropdown name="presets">
                  {TEXT_PRESETS.map((p) => (
                    <button key={p.name} onClick={() => { updateStyle(p.style); setOpenMenu(null); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 rounded">
                      {p.name}
                    </button>
                  ))}
                </Dropdown>
              </div>

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
