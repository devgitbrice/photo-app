"use client";

import { useState, useRef } from "react";
import type { Slide } from "../types";
import { createDefaultSlide } from "../types";

type Props = {
  slides: Slide[];
  setSlides: (s: Slide[]) => void;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
};

export default function PresentationSidebar({ slides, setSlides, currentIndex, setCurrentIndex }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const addSlide = () => {
    setSlides([...slides, createDefaultSlide()]);
    setCurrentIndex(slides.length);
  };

  const deleteSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (slides.length <= 1) return alert("Il faut au moins une diapositive.");
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentIndex >= newSlides.length) setCurrentIndex(newSlides.length - 1);
  };

  const duplicateSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const dup: Slide = {
      ...slides[index],
      id: crypto.randomUUID(),
      elements: slides[index].elements.map((el) => ({ ...el, id: crypto.randomUUID() })),
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, dup);
    setSlides(newSlides);
    setCurrentIndex(index + 1);
  };

  // ─── Drag & Drop ───────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    // Make the drag image semi-transparent
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "0.5";
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(index);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      setDropTarget(null);
      return;
    }

    const newSlides = [...slides];
    const [moved] = newSlides.splice(dragIndex, 1);
    newSlides.splice(toIndex, 0, moved);
    setSlides(newSlides);

    // Adjust currentIndex to follow the selected slide
    if (currentIndex === dragIndex) {
      setCurrentIndex(toIndex);
    } else if (dragIndex < currentIndex && toIndex >= currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (dragIndex > currentIndex && toIndex <= currentIndex) {
      setCurrentIndex(currentIndex + 1);
    }

    setDragIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropTarget(null);
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
  };

  return (
    <aside className="w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {slides.map((slide, index) => (
          <div key={slide.id}>
            {/* Drop indicator line */}
            {dropTarget === index && dragIndex !== null && dragIndex !== index && (
              <div className="h-0.5 bg-orange-500 rounded-full mx-2 my-0.5" />
            )}
            <div
              ref={dragIndex === index ? dragNodeRef : undefined}
              draggable
              onClick={() => setCurrentIndex(index)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-pointer group relative aspect-video w-full rounded-lg border-2 transition-all overflow-hidden ${
                dragIndex === index ? "opacity-50" : ""
              } ${
                index === currentIndex
                  ? "border-orange-500 bg-neutral-800"
                  : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-500"
              }`}
            >
              {/* Slide number */}
              <span className="absolute left-1 top-1 text-[10px] font-bold text-neutral-500 z-10">{index + 1}</span>

              {/* Drag handle indicator */}
              <div className="absolute right-1 top-1 z-10 hidden group-hover:flex flex-col gap-px cursor-grab">
                <div className="flex gap-px">
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                </div>
                <div className="flex gap-px">
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                </div>
                <div className="flex gap-px">
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                </div>
              </div>

              {/* Mini preview of elements */}
              <div
                className="w-full h-full relative"
                style={{ backgroundColor: slide.backgroundColor || "#ffffff" }}
              >
                {slide.elements
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((el) => (
                    <div
                      key={el.id}
                      className="absolute overflow-hidden"
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.width}%`,
                        height: `${el.height}%`,
                      }}
                    >
                      {el.type === "text" && (
                        <div
                          className="w-full h-full overflow-hidden"
                          style={{
                            fontSize: Math.max(3, (el.style.fontSize || 18) * 0.12),
                            fontWeight: el.style.fontWeight || "normal",
                            color: el.style.color || "#333",
                            textAlign: el.style.textAlign || "left",
                            lineHeight: 1.2,
                          }}
                        >
                          {el.content?.substring(0, 50)}
                        </div>
                      )}
                      {el.type === "image" && (
                        <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      )}
                      {el.type === "shape" && (
                        <div className="w-full h-full" style={{ backgroundColor: el.style.fill || "#3b82f6", borderRadius: el.shapeType === "circle" ? "50%" : 0 }} />
                      )}
                      {el.type === "icon" && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: el.style.color || "#333" }} />
                        </div>
                      )}
                      {el.type === "table" && (
                        <div className="w-full h-full border border-gray-300" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 30%, #ddd 30%, #ddd 31%)" }} />
                      )}
                    </div>
                  ))}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => deleteSlide(e, index)}
                className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white group-hover:flex hover:bg-red-500 z-20"
              >
                ×
              </button>

              {/* Duplicate button */}
              <button
                onClick={(e) => duplicateSlide(e, index)}
                className="absolute -left-1 -bottom-1 hidden h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white group-hover:flex hover:bg-blue-500 z-20"
                title="Dupliquer"
              >
                ⧉
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-neutral-800">
        <button
          onClick={addSlide}
          className="w-full rounded-xl bg-neutral-800 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
        >
          + Nouvelle diapositive
        </button>
      </div>
    </aside>
  );
}
