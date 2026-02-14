import html2canvas from "html2canvas";

export async function exportSlideAsImage(
  slideElement: HTMLElement,
  format: "png" | "jpeg" = "png",
  fileName: string = "slide"
): Promise<void> {
  const canvas = await html2canvas(slideElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = format === "jpeg" ? "jpg" : "png";
  const dataUrl = canvas.toDataURL(mimeType, 0.95);

  const link = document.createElement("a");
  link.download = `${fileName}.${ext}`;
  link.href = dataUrl;
  link.click();
}

export async function renderSlideToCanvas(slideElement: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(slideElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });
}
