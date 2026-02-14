"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Node, Edge } from "reactflow";
import MindmapCanvas from "./MindmapCanvas";
import TagSelector from "@/features/mydrive/components/TagSelector";
import { updateDriveItemAction, createMindmapAction } from "@/features/mydrive/modify";
import { Tag } from "@/features/mydrive/types";

interface MindmapEditorProps {
  allTags: Tag[];
  initialData: {
    id: string;
    title: string;
    content: string;
    observation: string;
    tags: Tag[];
  };
}

export default function MindmapEditor({ allTags, initialData }: MindmapEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.observation || "");
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData.tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [itemId, setItemId] = useState(initialData.id);

  const mapDataRef = useRef<{ nodes: Node[]; edges: Edge[] }>(
    initialData.content
      ? JSON.parse(initialData.content)
      : { nodes: [], edges: [] }
  );

  // Auto-save timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const contentToSave = JSON.stringify(mapDataRef.current);

      if (itemId) {
        await updateDriveItemAction(itemId, {
          title,
          observation: description,
          content: contentToSave,
        });
      } else {
        const result = await createMindmapAction({
          title,
          content: contentToSave,
          observation: description,
        });
        setItemId(result.id);
        router.replace(`/editmindmap/${result.id}`);
      }
    } catch {
      // silent save
    } finally {
      setIsSaving(false);
    }
  }, [itemId, title, description, isSaving, router]);

  // Debounced auto-save when data changes
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave();
    }, 2000);
  }, [doSave]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await doSave();
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      {/* HEADER */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-4 shadow-md z-10">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/mydrive" className="text-neutral-500 hover:text-white transition-colors p-2 bg-neutral-800 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutoSave();
            }}
            className="bg-transparent text-xl font-bold text-white outline-none border-b border-transparent focus:border-purple-500/50 flex-1 transition-all"
            placeholder="Titre de la mindmap..."
          />
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-neutral-500">Sauvegarde...</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-6 py-2 rounded-full font-bold text-white shadow-lg transition-all active:scale-95"
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* ZONE CANVAS */}
      <div className="flex-1 relative">
        <MindmapCanvas
          initialNodes={mapDataRef.current.nodes}
          initialEdges={mapDataRef.current.edges}
          onDataChange={(nodes: Node[], edges: Edge[]) => {
            mapDataRef.current = { nodes, edges };
            scheduleAutoSave();
          }}
        />
      </div>

      {/* FOOTER */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 z-10">
        <TagSelector
          itemId={itemId}
          itemTags={selectedTags}
          allTags={allTags}
          onTagsChange={(_, tags) => setSelectedTags(tags)}
          onNewTagCreated={(tag) => setSelectedTags([...selectedTags, tag])}
        />
      </div>
    </div>
  );
}
