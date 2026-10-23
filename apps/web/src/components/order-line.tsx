import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function OrderLine({
  image,
  name,
  spec,
  quantity,
  price,
  tags,
  leading,
  trailing,
}: {
  image: string | null;
  name: string;
  spec: string;
  quantity: number;
  price: string;
  tags: string[];
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {leading}
      {image ? (
        <img src={image} alt="" className="size-16 shrink-0 rounded-lg bg-muted object-contain" />
      ) : (
        <div className="size-16 shrink-0 rounded-lg bg-muted" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium">{name}</p>
          {trailing}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">{spec}</span>
          <span className="shrink-0 tabular-nums">x{quantity}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums">{price}</span>
          {tags.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1">
              {tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
