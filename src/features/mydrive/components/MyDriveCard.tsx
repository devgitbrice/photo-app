import type { MyDriveItem } from "@/features/mydrive/types";

type Props = {
  item: MyDriveItem;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function MyDriveCard({ item }: Props) {
  return (
    <article className="rounded-2xl border overflow-hidden shadow-sm">
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.title}
        className="w-full aspect-[4/3] object-cover bg-black/5"
        loading="lazy"
      />

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug line-clamp-2">{item.title}</h3>
          <span className="text-xs opacity-60 whitespace-nowrap">
            {formatDate(item.created_at)}
          </span>
        </div>

        <p className="text-sm opacity-80 line-clamp-3">{item.observation}</p>

        {/* Meta */}
        <div className="pt-2 text-xs opacity-60">
          ID: <span className="font-mono">{item.id.slice(0, 8)}…</span>
        </div>
      </div>
    </article>
  );
}
