import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Slide } from "../types";

export async function exportSlidesToPdf(
  slides: Slide[],
  title: string,
  renderSlide: (index: number) => Promise<HTMLElement | null>
): Promise<void> {
  // Landscape A4: 297mm x 210mm (16:9 approx)
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 167] });

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) pdf.addPage([297, 167], "landscape");

    const el = await renderSlide(i);
    if (!el) continue;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, 0, 297, 167);
  }

  pdf.save(`${title || "presentation"}.pdf`);
}
