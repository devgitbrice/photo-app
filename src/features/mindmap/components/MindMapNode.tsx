"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { useState, useRef, useEffect } from "react";

export default function MindMapNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const finishEditing = () => {
    setIsEditing(false);
    data.label = label;
  };

  const onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter") {
      finishEditing();
    }
  };

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={`
        px-4 py-2 rounded-lg border shadow-lg
        min-w-[150px] h-[50px] flex items-center justify-center transition-all duration-200
        ${
          selected
            ? "bg-neutral-800 border-blue-500 ring-2 ring-blue-500/50 text-white"
            : "bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-500"
        }
      `}
    >
      {/* Point d'entrée (Gauche) */}
      {!data.isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-blue-500 !border-none"
        />
      )}

      {/* Contenu */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={onKeyDown}
          className="w-full text-center text-sm outline-none bg-transparent text-white font-medium"
        />
      ) : (
        <span className="text-sm font-medium pointer-events-none select-none">
          {label}
        </span>
      )}

      {/* Point de sortie (Droite) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-none"
      />
    </div>
  );
}