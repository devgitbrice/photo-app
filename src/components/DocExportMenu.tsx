"use client";

import { useState } from "react";
import { Download, FileText, ChevronDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

interface DocExportMenuProps {
  title: string;
  getContent: () => string;
}

function htmlToPlainBlocks(html: string): { text: string; tag: string }[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const blocks: { text: string; tag: string }[] = [];

  const walk = (el: Element) => {
    const tag = el.tagName?.toLowerCase() || "p";
    if (["h1", "h2", "h3", "p", "li", "blockquote", "pre"].includes(tag)) {
      const text = el.textContent?.trim() || "";
      if (text) blocks.push({ text, tag });
    } else {
      for (const child of Array.from(el.children)) {
        walk(child);
      }
      // If no children with content, get text directly
      if (el.children.length === 0) {
        const text = el.textContent?.trim() || "";
        if (text) blocks.push({ text, tag: "p" });
      }
    }
  };

  walk(div);
  return blocks;
}

export default function DocExportMenu({ title, getContent }: DocExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      const content = getContent();
      const blocks = htmlToPlainBlocks(content.replace(/\|\|BLOCK\|\|/g, ""));

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      const titleLines = pdf.splitTextToSize(title || "Document", maxWidth);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 10 + 8;

      // Separator
      pdf.setDrawColor(200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      for (const block of blocks) {
        let fontSize = 11;
        let fontStyle = "normal";

        switch (block.tag) {
          case "h1":
            fontSize = 18;
            fontStyle = "bold";
            break;
          case "h2":
            fontSize = 15;
            fontStyle = "bold";
            break;
          case "h3":
            fontSize = 13;
            fontStyle = "bold";
            break;
          case "blockquote":
            fontSize = 11;
            fontStyle = "italic";
            break;
          case "pre":
            fontSize = 9;
            fontStyle = "normal";
            break;
          case "li":
            fontSize = 11;
            fontStyle = "normal";
            break;
          default:
            fontSize = 11;
        }

        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", fontStyle);

        const prefix = block.tag === "li" ? "  - " : "";
        const textContent = prefix + block.text;
        const lines = pdf.splitTextToSize(textContent, maxWidth);
        const lineHeight = fontSize * 0.5;

        // Check if we need a new page
        if (y + lines.length * lineHeight > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.text(lines, margin, y);
        y += lines.length * lineHeight + 4;
      }

      pdf.save(`${title || "document"}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
    }
    setExporting(null);
    setOpen(false);
  };

  const handleExportDOCX = async () => {
    setExporting("docx");
    try {
      const content = getContent();
      const blocks = htmlToPlainBlocks(content.replace(/\|\|BLOCK\|\|/g, ""));

      const children: Paragraph[] = [
        new Paragraph({
          text: title || "Document",
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        }),
      ];

      for (const block of blocks) {
        let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined;
        let bold = false;
        let italics = false;
        let font: string | undefined;

        switch (block.tag) {
          case "h1":
            heading = HeadingLevel.HEADING_1;
            break;
          case "h2":
            heading = HeadingLevel.HEADING_2;
            break;
          case "h3":
            heading = HeadingLevel.HEADING_3;
            break;
          case "blockquote":
            italics = true;
            break;
          case "pre":
            font = "Courier New";
            break;
          case "li":
            break;
        }

        const paragraph = new Paragraph({
          heading,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: block.tag === "li" ? `- ${block.text}` : block.text,
              bold,
              italics,
              font: font,
              size: block.tag === "pre" ? 18 : undefined,
            }),
          ],
        });

        children.push(paragraph);
      }

      const doc = new Document({
        sections: [{ children }],
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `${title || "document"}.docx`);
    } catch (e) {
      console.error("DOCX export error:", e);
    }
    setExporting(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
        title="Exporter"
      >
        <Download size={14} />
        Exporter
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 w-48 overflow-hidden">
            <div className="p-1">
              <button
                onClick={handleExportPDF}
                disabled={exporting !== null}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded disabled:opacity-50"
              >
                {exporting === "pdf" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} className="text-red-400" />
                )}
                PDF
              </button>
              <button
                onClick={handleExportDOCX}
                disabled={exporting !== null}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded disabled:opacity-50"
              >
                {exporting === "docx" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} className="text-blue-400" />
                )}
                Word (.docx)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
