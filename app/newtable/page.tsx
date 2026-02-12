// Dans app/newtable/page.tsx
import TableEditor from "../../src/features/table/components/TableEditor";

export default function NewTablePage() {
  return (
    <main className="h-dvh w-full bg-neutral-950 text-white overflow-hidden flex flex-col">
      <TableEditor />
    </main>
  );
}