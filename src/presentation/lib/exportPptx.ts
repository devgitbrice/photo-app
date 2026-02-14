import PptxGenJS from "pptxgenjs";
import type { Slide, SlideElement } from "../types";

// Convert percentage (0-100) to inches for 10x5.625 slide
const pctToInchX = (pct: number) => (pct / 100) * 10;
const pctToInchY = (pct: number) => (pct / 100) * 5.625;

// Convert hex color to PPTX format (without #)
const toColor = (hex?: string) => (hex || "#333333").replace("#", "");

export async function exportToPptx(slides: Slide[], title: string): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.title = title || "Presentation";
  pptx.layout = "LAYOUT_16x9";

  for (const slideData of slides) {
    const pptSlide = pptx.addSlide();

    if (slideData.backgroundColor && slideData.backgroundColor !== "#ffffff") {
      pptSlide.background = { color: toColor(slideData.backgroundColor) };
    }

    for (const el of slideData.elements) {
      const pos = {
        x: pctToInchX(el.x),
        y: pctToInchY(el.y),
        w: pctToInchX(el.width),
        h: pctToInchY(el.height),
        rotate: el.rotation || 0,
      };

      try {
        switch (el.type) {
          case "text":
            addTextElement(pptSlide, el, pos);
            break;
          case "image":
            addImageElement(pptSlide, el, pos);
            break;
          case "shape":
            addShapeElement(pptSlide, el, pos);
            break;
          case "table":
            addTableElement(pptSlide, el, pos);
            break;
          case "icon":
            // Icons exported as text placeholder
            addIconAsText(pptSlide, el, pos);
            break;
        }
      } catch (e) {
        console.warn("Failed to export element:", el.id, e);
      }
    }
  }

  await pptx.writeFile({ fileName: `${title || "presentation"}.pptx` });
}

function addTextElement(
  slide: PptxGenJS.Slide,
  el: SlideElement,
  pos: { x: number; y: number; w: number; h: number; rotate: number }
) {
  const s = el.style;
  const align = s.textAlign === "justify" ? "justify" : s.textAlign || "left";

  slide.addText(el.content || "", {
    x: pos.x, y: pos.y, w: pos.w, h: pos.h,
    rotate: pos.rotate,
    fontSize: s.fontSize ? Math.round(s.fontSize * 0.75) : 14,
    fontFace: s.fontFamily || "Arial",
    color: toColor(s.color),
    bold: s.fontWeight === "bold" || Number(s.fontWeight) >= 700,
    italic: s.fontStyle === "italic",
    underline: { style: s.textDecoration === "underline" ? "sng" : "none" },
    align: align as "left" | "center" | "right" | "justify",
    valign: s.verticalAlign === "middle" ? "middle" : s.verticalAlign === "bottom" ? "bottom" : "top",
    fill: s.backgroundColor && s.backgroundColor !== "transparent" ? { color: toColor(s.backgroundColor) } : undefined,
    lineSpacingMultiple: s.lineHeight || 1.4,
    wrap: true,
  });
}

function addImageElement(
  slide: PptxGenJS.Slide,
  el: SlideElement,
  pos: { x: number; y: number; w: number; h: number; rotate: number }
) {
  if (!el.src) return;

  if (el.src.startsWith("data:")) {
    slide.addImage({
      data: el.src,
      x: pos.x, y: pos.y, w: pos.w, h: pos.h,
      rotate: pos.rotate,
      sizing: { type: el.objectFit === "cover" ? "cover" : "contain", w: pos.w, h: pos.h },
    });
  } else {
    slide.addImage({
      path: el.src,
      x: pos.x, y: pos.y, w: pos.w, h: pos.h,
      rotate: pos.rotate,
    });
  }
}

function addShapeElement(
  slide: PptxGenJS.Slide,
  el: SlideElement,
  pos: { x: number; y: number; w: number; h: number; rotate: number }
) {
  const s = el.style;
  const shapeMap: Record<string, string> = {
    rectangle: "rect",
    "rounded-rect": "roundRect",
    circle: "ellipse",
    ellipse: "ellipse",
    triangle: "triangle",
    diamond: "diamond",
    star: "star5",
    hexagon: "hexagon",
    pentagon: "pentagon",
    line: "line",
    callout: "wedgeRoundRectCallout",
    "arrow-right": "rightArrow",
    "arrow-left": "leftArrow",
  };

  const shapeName = shapeMap[el.shapeType || "rectangle"] || "rect";
  const pptxShape = (PptxGenJS.ShapeType as Record<string, PptxGenJS.ShapeType>)[shapeName];

  if (pptxShape) {
    slide.addShape(pptxShape, {
      x: pos.x, y: pos.y, w: pos.w, h: pos.h,
      rotate: pos.rotate,
      fill: { color: toColor(s.fill || "#3b82f6") },
      line: s.stroke ? { color: toColor(s.stroke), width: s.strokeWidth || 1 } : undefined,
    });
  } else {
    // Fallback to rectangle
    slide.addShape(PptxGenJS.ShapeType.rect, {
      x: pos.x, y: pos.y, w: pos.w, h: pos.h,
      rotate: pos.rotate,
      fill: { color: toColor(s.fill || "#3b82f6") },
    });
  }
}

function addTableElement(
  slide: PptxGenJS.Slide,
  el: SlideElement,
  pos: { x: number; y: number; w: number; h: number; rotate: number }
) {
  const data = el.tableData || [[""]];
  const s = el.style;

  const rows: PptxGenJS.TableRow[] = data.map((row, ri) =>
    row.map((cell) => ({
      text: cell,
      options: {
        fontSize: s.fontSize ? Math.round(s.fontSize * 0.75) : 10,
        color: toColor(s.color),
        bold: ri === 0,
        fill: { color: ri === 0 ? toColor(s.backgroundColor || "#f3f4f6") : "FFFFFF" },
        border: { type: "solid" as const, pt: 0.5, color: "CCCCCC" },
        valign: "middle" as const,
      },
    }))
  );

  slide.addTable(rows, {
    x: pos.x, y: pos.y, w: pos.w,
    colW: Array(data[0]?.length || 1).fill(pos.w / (data[0]?.length || 1)),
  });
}

function addIconAsText(
  slide: PptxGenJS.Slide,
  el: SlideElement,
  pos: { x: number; y: number; w: number; h: number; rotate: number }
) {
  // Icons can't be directly exported; add as a text placeholder
  slide.addText(`[${el.iconName || "icon"}]`, {
    x: pos.x, y: pos.y, w: pos.w, h: pos.h,
    rotate: pos.rotate,
    fontSize: 14,
    color: toColor(el.style.color),
    align: "center",
    valign: "middle",
  });
}
