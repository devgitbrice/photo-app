// On remonte à la racine (../../) puis on descend dans src/features/...
import MindmapEditor from "../../src/features/mindmap/components/MindmapEditor";

export default function NewMindmapPage() {
  return (
    <main className="h-dvh w-full bg-neutral-950 text-white overflow-hidden flex flex-col">
      <MindmapEditor />
    </main>
  );
}