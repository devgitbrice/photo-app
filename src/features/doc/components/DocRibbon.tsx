import React from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Type,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Minus, Quote, Code, Undo, Redo, PanelLeft
} from "lucide-react";

interface DocRibbonProps {
  tocOpen: boolean;
  setTocOpen: (val: boolean) => void;
}

export default function DocRibbon({ tocOpen, setTocOpen }: DocRibbonProps) {
  const exec = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    document.execCommand(command, false, value);
  };

  const groups = [
    [
      { icon: <Bold size={16} />, title: "Gras", cmd: "bold" },
      { icon: <Italic size={16} />, title: "Italique", cmd: "italic" },
      { icon: <Underline size={16} />, title: "Souligné", cmd: "underline" },
      { icon: <Strikethrough size={16} />, title: "Barré", cmd: "strikeThrough" },
    ],
    [
      { icon: <Heading1 size={16} />, title: "Titre 1", cmd: "formatBlock", val: "h1" },
      { icon: <Heading2 size={16} />, title: "Titre 2", cmd: "formatBlock", val: "h2" },
      { icon: <Heading3 size={16} />, title: "Titre 3", cmd: "formatBlock", val: "h3" },
      { icon: <Type size={16} />, title: "Paragraphe", cmd: "formatBlock", val: "p" },
    ],
    [
      { icon: <List size={16} />, title: "Liste à puces", cmd: "insertUnorderedList" },
      { icon: <ListOrdered size={16} />, title: "Liste numérotée", cmd: "insertOrderedList" },
    ],
    [
      { icon: <AlignLeft size={16} />, title: "Gauche", cmd: "justifyLeft" },
      { icon: <AlignCenter size={16} />, title: "Centre", cmd: "justifyCenter" },
      { icon: <AlignRight size={16} />, title: "Droite", cmd: "justifyRight" },
    ],
    [
      { icon: <Minus size={16} />, title: "Ligne", cmd: "insertHorizontalRule" },
      { icon: <Quote size={16} />, title: "Citation", cmd: "formatBlock", val: "blockquote" },
      { icon: <Code size={16} />, title: "Code", cmd: "formatBlock", val: "pre" },
    ],
    [
      { icon: <Undo size={16} />, title: "Annuler", cmd: "undo" },
      { icon: <Redo size={16} />, title: "Rétablir", cmd: "redo" },
    ],
  ];

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 overflow-x-auto flex items-center gap-1 min-w-max shrink-0">
      {/* Bouton du Plan (TOC) */}
      <button
        onClick={() => setTocOpen(!tocOpen)}
        title={tocOpen ? "Masquer le plan" : "Afficher le plan"}
        className={`p-1.5 rounded transition-colors ${tocOpen ? "text-blue-400 bg-neutral-800" : "text-neutral-300 hover:bg-neutral-700 hover:text-white"}`}
      >
        <PanelLeft size={16} />
      </button>
      <div className="w-px h-6 bg-neutral-700 mx-1.5 shrink-0" />

      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div className="w-px h-6 bg-neutral-700 mx-1.5 shrink-0" />}
          <div className="flex items-center gap-0.5">
            {group.map((btn, bi) => (
              <button key={bi} onMouseDown={(e) => exec(e, btn.cmd, btn.val)} title={btn.title} className="p-1.5 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded transition-colors">
                {btn.icon}
              </button>
            ))}
          </div>
        </React.Fragment>
      ))}
      <div className="w-px h-6 bg-neutral-700 mx-1.5 shrink-0" />
      <label title="Couleur du texte" className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-700 transition-colors">
        <span className="text-sm text-neutral-300 font-bold">A</span>
        <input type="color" defaultValue="#ffffff" onMouseDown={(e) => e.preventDefault()} onChange={(e) => document.execCommand("foreColor", false, e.target.value)} className="w-4 h-4 border-0 bg-transparent cursor-pointer" />
      </label>
      <label title="Surligner" className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-700 transition-colors">
        <span className="text-sm text-neutral-900 bg-yellow-400 px-1 rounded font-bold">A</span>
        <input type="color" defaultValue="#000000" onMouseDown={(e) => e.preventDefault()} onChange={(e) => document.execCommand("hiliteColor", false, e.target.value)} className="w-4 h-4 border-0 bg-transparent cursor-pointer" />
      </label>
    </div>
  );
}