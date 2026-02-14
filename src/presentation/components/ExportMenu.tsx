"use client";

import { useState } from "react";
import {
  Download, FileText, Image as ImageIcon, FileSpreadsheet,
  Share2, ChevronDown, Link2, Check, Loader2,
} from "lucide-react";
import type { Slide } from "../types";
import { exportSlideAsImage } from "../lib/exportImage";
import { exportSlidesToPdf } from "../lib/exportPdf";
import { exportToPptx } from "../lib/exportPptx";

type Props = {
  slides: Slide[];
  title: string;
};

export default function ExportMenu({ slides, title }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getSlideElement = (): HTMLElement | null => document.getElementById("slide-canvas");

  const handleExportPNG = async () => {
    setExporting("png");
    try {
      const el = getSlideElement();
      if (el) await exportSlideAsImage(el, "png", title || "slide");
    } catch (e) {
      console.error("Export PNG error:", e);
    }
    setExporting(null);
    setOpen(false);
  };

  const handleExportJPG = async () => {
    setExporting("jpg");
    try {
      const el = getSlideElement();
      if (el) await exportSlideAsImage(el, "jpeg", title || "slide");
    } catch (e) {
      console.error("Export JPG error:", e);
    }
    setExporting(null);
    setOpen(false);
  };

  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      // For PDF we need to render each slide. We'll use a temporary approach:
      // render the current visible slide canvas for all slides.
      // A proper implementation would render each slide off-screen.
      const el = getSlideElement();
      if (el) {
        await exportSlidesToPdf(slides, title || "presentation", async () => el);
      }
    } catch (e) {
      console.error("Export PDF error:", e);
    }
    setExporting(null);
    setOpen(false);
  };

  const handleExportPPTX = async () => {
    setExporting("pptx");
    try {
      await exportToPptx(slides, title || "presentation");
    } catch (e) {
      console.error("Export PPTX error:", e);
    }
    setExporting(null);
    setOpen(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const items = [
    { key: "pdf", label: "PDF", icon: FileText, action: handleExportPDF },
    { key: "png", label: "Image PNG", icon: ImageIcon, action: handleExportPNG },
    { key: "jpg", label: "Image JPG", icon: ImageIcon, action: handleExportJPG },
    { key: "pptx", label: "PowerPoint (.pptx)", icon: FileSpreadsheet, action: handleExportPPTX },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
      >
        <Download size={14} />
        Exporter
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 w-56 overflow-hidden">
            <div className="p-1">
              <p className="px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Formats d&apos;export
              </p>
              {items.map(({ key, label, icon: Icon, action }) => (
                <button
                  key={key}
                  onClick={action}
                  disabled={exporting !== null}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded disabled:opacity-50"
                >
                  {exporting === key ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  {label}
                </button>
              ))}

              <div className="border-t border-neutral-700 my-1" />

              <p className="px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Partage
              </p>
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
                {copied ? "Lien copié !" : "Copier le lien"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
