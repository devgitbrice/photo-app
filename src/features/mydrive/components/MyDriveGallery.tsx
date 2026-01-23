import type { MyDriveListProps } from "@/features/mydrive/types";
import MyDriveCard from "@/features/mydrive/components/MyDriveCard";

export default function MyDriveGallery({ items }: MyDriveListProps) {
  return (
    <section className="space-y-4">
      {/* Petite info */}
      <div className="text-sm opacity-70">
        {items.length} élément{items.length > 1 ? "s" : ""}
      </div>

      {/* Grid responsive (mobile -> 1 colonne, tablette -> 2, desktop -> 3) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MyDriveCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
