"use client";

import type { Slide } from "./PresentationEditor";

type Props = {
  slide: Slide;
  updateSlide: (s: Slide) => void;
};

export default function PresentationSlide({ slide, updateSlide }: Props) {
  
  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...slide.bullets];
    newBullets[index] = value;
    updateSlide({ ...slide, bullets: newBullets });
  };

  const addBullet = () => {
    updateSlide({ ...slide, bullets: [...slide.bullets, ""] });
  };

  const removeBullet = (index: number) => {
    const newBullets = slide.bullets.filter((_, i) => i !== index);
    updateSlide({ ...slide, bullets: newBullets });
  };

  return (
    <div className="flex-1 bg-neutral-950 flex items-center justify-center p-8 overflow-y-auto">
      {/* Simulation d'une feuille 16:9 */}
      <div className="aspect-video w-full max-w-4xl bg-white text-black shadow-2xl rounded-sm p-12 flex flex-col gap-8">
        
        {/* Titre de la slide */}
        <input
          type="text"
          value={slide.title}
          onChange={(e) => updateSlide({ ...slide, title: e.target.value })}
          placeholder="Titre de la diapositive"
          className="w-full text-4xl font-bold border-b-2 border-transparent focus:border-orange-500 outline-none pb-2 placeholder-gray-300"
        />

        {/* Liste à puces */}
        <div className="flex-1 space-y-3">
          {slide.bullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-3 group">
              <span className="text-2xl text-orange-500 leading-none">•</span>
              <textarea
                value={bullet}
                onChange={(e) => handleBulletChange(index, e.target.value)}
                rows={1}
                className="flex-1 text-2xl font-light outline-none bg-transparent resize-none overflow-hidden"
                placeholder="Texte..."
                onInput={(e) => {
                  // Auto-resize
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
              <button 
                onClick={() => removeBullet(index)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 font-bold px-2"
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            onClick={addBullet}
            className="mt-4 text-gray-400 hover:text-orange-600 flex items-center gap-2 font-medium"
          >
            + Ajouter un point
          </button>
        </div>
      </div>
    </div>
  );
}