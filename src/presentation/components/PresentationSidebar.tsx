"use client";

import type { Slide } from "./PresentationEditor";

type Props = {
  slides: Slide[];
  setSlides: (s: Slide[]) => void;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
};

export default function PresentationSidebar({ slides, setSlides, currentIndex, setCurrentIndex }: Props) {
  const addSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      title: "Nouvelle Slide",
      bullets: ["Point 1", "Point 2"],
    };
    setSlides([...slides, newSlide]);
    setCurrentIndex(slides.length); // On va sur la nouvelle slide
  };

  const deleteSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (slides.length <= 1) return alert("Il faut au moins une slide.");
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentIndex >= newSlides.length) setCurrentIndex(newSlides.length - 1);
  };

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            className={`cursor-pointer group relative aspect-video w-full rounded-lg border-2 p-2 transition-all ${
              index === currentIndex
                ? "border-orange-500 bg-neutral-800"
                : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-500"
            }`}
          >
            {/* Numéro */}
            <span className="absolute left-1 top-1 text-xs font-bold text-neutral-500">{index + 1}</span>
            
            {/* Miniature simplifiée */}
            <div className="mt-4 flex flex-col gap-1 px-1">
              <div className="h-1.5 w-3/4 rounded-full bg-neutral-600" />
              <div className="h-1 w-1/2 rounded-full bg-neutral-700" />
              <div className="h-1 w-1/2 rounded-full bg-neutral-700" />
            </div>

            {/* Bouton Supprimer */}
            <button
              onClick={(e) => deleteSlide(e, index)}
              className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white group-hover:flex hover:bg-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={addSlide}
          className="w-full rounded-xl bg-neutral-800 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
        >
          + Nouvelle Slide
        </button>
      </div>
    </aside>
  );
}