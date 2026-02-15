import type { MyDriveItem } from "@/features/mydrive/types";

/**
 * Télécharge un item MyDrive dans le format adapté à son type :
 * - scan / photo → télécharge le fichier original (PDF ou image)
 * - doc → export DOCX
 * - presentation → export PPTX
 * - table → export XLSX
 */
export async function downloadItemAsFile(item: MyDriveItem): Promise<void> {
  const itemData = item as any;
  const docType: string | null = itemData.doc_type || null;
  const title = item.title || "document";

  try {
    switch (docType) {
      case "doc":
        await exportAsDocx(item, title);
        break;
      case "presentation":
        await exportAsPptx(item, title);
        break;
      case "table":
        await exportAsXlsx(item, title);
        break;
      case "scan":
        downloadFileUrl(item.image_url, title, ".pdf");
        break;
      default:
        // Photo ou autre fichier avec URL
        if (item.image_url) {
          const ext = guessExtension(item.image_url);
          downloadFileUrl(item.image_url, title, ext);
        }
        break;
    }
  } catch (err) {
    console.error("Erreur lors du téléchargement:", err);
    alert("Erreur lors du téléchargement du fichier.");
  }
}

// --- Télécharger un fichier via URL ---
function downloadFileUrl(url: string, title: string, fallbackExt: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFilename(title) + fallbackExt;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- Export DOCX ---
async function exportAsDocx(item: MyDriveItem, title: string) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const content = item.content || "";
  const lines = content.split("\n");

  const paragraphs = lines.map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line })],
      })
  );

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, sanitizeFilename(title) + ".docx");
}

// --- Export PPTX ---
async function exportAsPptx(item: MyDriveItem, title: string) {
  const { parseSlides } = await import("@/presentation/types");
  const { exportToPptx } = await import("@/presentation/lib/exportPptx");

  const slides = parseSlides(item.content || "");
  await exportToPptx(slides, title);
}

// --- Export XLSX ---
async function exportAsXlsx(item: MyDriveItem, title: string) {
  const XLSX = await import("xlsx");

  let data: string[][] = [];
  try {
    data = JSON.parse(item.content || "[]");
  } catch {
    data = [[""]];
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, sanitizeFilename(title) + ".xlsx");
}

// --- Helpers ---
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "document";
}

function guessExtension(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".heic")) return ".heic";
  return ".jpg";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
