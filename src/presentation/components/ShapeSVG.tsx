import type { ShapeType } from "../types";

type Props = {
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export default function ShapeSVG({ shapeType, fill, stroke, strokeWidth }: Props) {
  const sw = strokeWidth;
  const common = { fill, stroke, strokeWidth: sw };

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      {shapeType === "rectangle" && <rect x={sw} y={sw} width={100 - sw * 2} height={100 - sw * 2} {...common} />}
      {shapeType === "rounded-rect" && <rect x={sw} y={sw} width={100 - sw * 2} height={100 - sw * 2} rx="12" ry="12" {...common} />}
      {shapeType === "circle" && <circle cx="50" cy="50" r={48 - sw} {...common} />}
      {shapeType === "ellipse" && <ellipse cx="50" cy="50" rx={48 - sw} ry={38 - sw} {...common} />}
      {shapeType === "triangle" && <polygon points="50,2 98,98 2,98" {...common} />}
      {shapeType === "diamond" && <polygon points="50,2 98,50 50,98 2,50" {...common} />}
      {shapeType === "arrow-right" && <polygon points="0,25 65,25 65,5 100,50 65,95 65,75 0,75" {...common} />}
      {shapeType === "arrow-left" && <polygon points="100,25 35,25 35,5 0,50 35,95 35,75 100,75" {...common} />}
      {shapeType === "star" && (
        <polygon
          points="50,2 61,35 97,35 68,57 79,91 50,70 21,91 32,57 3,35 39,35"
          {...common}
        />
      )}
      {shapeType === "hexagon" && <polygon points="25,2 75,2 98,50 75,98 25,98 2,50" {...common} />}
      {shapeType === "pentagon" && <polygon points="50,2 97,38 80,95 20,95 3,38" {...common} />}
      {shapeType === "line" && <line x1="2" y1="50" x2="98" y2="50" stroke={stroke || "#333"} strokeWidth={sw || 2} />}
      {shapeType === "callout" && (
        <g>
          <rect x={sw} y={sw} width={100 - sw * 2} height={75 - sw} rx="8" ry="8" {...common} />
          <polygon points="25,73 35,73 20,98" fill={fill} stroke={stroke} strokeWidth={sw} />
        </g>
      )}
    </svg>
  );
}
