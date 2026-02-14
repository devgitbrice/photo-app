// ─── Element Styles ───────────────────────────────────────────────
export type ElementStyle = {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  fontStyle?: "normal" | "italic";
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: "none" | "underline" | "line-through";
  textShadow?: string;
  WebkitTextStroke?: string;
  borderRadius?: number;
  border?: string;
  opacity?: number;
  listStyle?: "none" | "disc" | "decimal";
  columns?: number;
  padding?: number;
  // Shape-specific
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

// ─── Shape Types ──────────────────────────────────────────────────
export type ShapeType =
  | "rectangle"
  | "rounded-rect"
  | "circle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "arrow-right"
  | "arrow-left"
  | "star"
  | "hexagon"
  | "pentagon"
  | "line"
  | "callout";

// ─── Slide Element ────────────────────────────────────────────────
export type SlideElement = {
  id: string;
  type: "text" | "image" | "shape" | "icon" | "table";
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  // Text
  content?: string;
  // Image
  src?: string;
  objectFit?: "cover" | "contain" | "fill";
  // Shape
  shapeType?: ShapeType;
  // Icon
  iconName?: string;
  iconSize?: number;
  // Table
  tableData?: string[][];
  // Style
  style: ElementStyle;
};

// ─── Slide ────────────────────────────────────────────────────────
export type Slide = {
  id: string;
  elements: SlideElement[];
  backgroundColor?: string;
};

// ─── Old format (for migration) ──────────────────────────────────
type OldSlide = { id: string; title: string; bullets: string[] };

function isOldFormat(s: unknown): s is OldSlide {
  return typeof s === "object" && s !== null && "title" in s && "bullets" in s && !("elements" in s);
}

export function migrateSlide(raw: unknown): Slide {
  if (!raw || typeof raw !== "object") {
    return { id: crypto.randomUUID(), elements: [], backgroundColor: "#ffffff" };
  }
  if (!isOldFormat(raw)) return raw as Slide;
  const old = raw as OldSlide;
  const elements: SlideElement[] = [];
  elements.push({
    id: crypto.randomUUID(),
    type: "text",
    x: 5, y: 5, width: 90, height: 15,
    rotation: 0, zIndex: 1,
    content: old.title,
    style: { fontSize: 36, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  });
  if (old.bullets.length > 0) {
    elements.push({
      id: crypto.randomUUID(),
      type: "text",
      x: 10, y: 25, width: 80, height: 65,
      rotation: 0, zIndex: 2,
      content: old.bullets.map((b) => `• ${b}`).join("\n"),
      style: { fontSize: 20, fontWeight: "normal", color: "#333333", textAlign: "left" },
    });
  }
  return { id: old.id, elements, backgroundColor: "#ffffff" };
}

export function parseSlides(content: string): Slide[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(migrateSlide);
    }
  } catch {}
  return [createDefaultSlide()];
}

export function createDefaultSlide(): Slide {
  return {
    id: crypto.randomUUID(),
    elements: [
      {
        id: crypto.randomUUID(),
        type: "text",
        x: 10, y: 10, width: 80, height: 15,
        rotation: 0, zIndex: 1,
        content: "Nouvelle diapositive",
        style: { fontSize: 36, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        x: 10, y: 30, width: 80, height: 50,
        rotation: 0, zIndex: 2,
        content: "Cliquez pour ajouter du texte",
        style: { fontSize: 20, color: "#666666", textAlign: "left" },
      },
    ],
    backgroundColor: "#ffffff",
  };
}

// ─── Text Presets ─────────────────────────────────────────────────
export type TextPreset = { name: string; style: Partial<ElementStyle> };

export const TEXT_PRESETS: TextPreset[] = [
  { name: "Titre", style: { fontSize: 40, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" } },
  { name: "Sous-titre", style: { fontSize: 28, fontWeight: "300", color: "#555555", textAlign: "center" } },
  { name: "Corps", style: { fontSize: 18, fontWeight: "normal", color: "#333333", textAlign: "left" } },
  { name: "Citation", style: { fontSize: 22, fontStyle: "italic", color: "#666666", textAlign: "center" } },
  { name: "Accroche", style: { fontSize: 32, fontWeight: "bold", color: "#ea580c", textAlign: "left" } },
];

// ─── Available shapes ─────────────────────────────────────────────
export const AVAILABLE_SHAPES: { type: ShapeType; label: string }[] = [
  { type: "rectangle", label: "Rectangle" },
  { type: "rounded-rect", label: "Rect. arrondi" },
  { type: "circle", label: "Cercle" },
  { type: "ellipse", label: "Ellipse" },
  { type: "triangle", label: "Triangle" },
  { type: "diamond", label: "Losange" },
  { type: "arrow-right", label: "Flèche →" },
  { type: "arrow-left", label: "Flèche ←" },
  { type: "star", label: "Étoile" },
  { type: "hexagon", label: "Hexagone" },
  { type: "pentagon", label: "Pentagone" },
  { type: "line", label: "Ligne" },
  { type: "callout", label: "Bulle" },
];

// ─── Available icon names (from lucide-react) ─────────────────────
export const AVAILABLE_ICONS = [
  "Star", "Heart", "ThumbsUp", "Check", "X", "AlertTriangle", "Info",
  "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
  "Users", "User", "Settings", "Search", "Home", "Mail",
  "Phone", "Calendar", "Clock", "Globe", "MapPin",
  "Camera", "Image", "Video", "Music", "Mic",
  "FileText", "Folder", "Download", "Upload", "Share2",
  "BarChart2", "PieChart", "TrendingUp", "TrendingDown", "Activity",
  "Zap", "Target", "Award", "Flag", "Bookmark",
  "Sun", "Moon", "Cloud", "Coffee",
  "Gift", "ShoppingCart", "CreditCard", "DollarSign",
  "Lock", "Unlock", "Shield", "Eye",
  "Wifi", "Monitor", "Smartphone", "Cpu",
  "Database", "Server", "Code", "Terminal", "GitBranch",
  "Lightbulb", "Rocket", "Brain", "Sparkles",
] as const;

// ─── Text effect presets ──────────────────────────────────────────
export const TEXT_EFFECTS = [
  { name: "Aucun", shadow: "none", stroke: "" },
  { name: "Ombre portée", shadow: "2px 2px 4px rgba(0,0,0,0.5)", stroke: "" },
  { name: "Ombre douce", shadow: "0 0 8px rgba(0,0,0,0.3)", stroke: "" },
  { name: "Contour", shadow: "none", stroke: "1px #000" },
  { name: "Reflet", shadow: "0 4px 6px rgba(0,0,0,0.3)", stroke: "" },
  { name: "Néon", shadow: "0 0 10px #ea580c, 0 0 20px #ea580c", stroke: "" },
];

// ─── Font families ────────────────────────────────────────────────
export const FONT_FAMILIES = [
  "Arial", "Helvetica", "Georgia", "Times New Roman",
  "Courier New", "Verdana", "Trebuchet MS", "Impact",
  "Comic Sans MS", "Palatino", "Garamond", "Bookman",
];
