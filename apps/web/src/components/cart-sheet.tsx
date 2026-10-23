"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { formatYuan, shippingFee, type ShippingRule } from "@tshirt/design";
import { removeCartItem } from "@/server/actions";
import { OrderLine } from "@/components/order-line";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type CartLine = {
  id: string;
  name: string;
  spec: string;
  quantity: number;
  image: string | null;
  price: string;
  goodsCents: number;
  tags: string[];
};

export function CartSheet({ slug, lines, shipping }: { slug: string; lines: CartLine[]; shipping: ShippingRule }) {
  const [selected, setSelected] = useState(lines.map((line) => line.id));
  const chosen = lines.filter((line) => selected.includes(line.id));
  const pieces = chosen.reduce((sum, line) => sum + line.quantity, 0);
  const goodsCents = chosen.reduce((sum, line) => sum + line.goodsCents, 0);
  const totalCents = goodsCents + (chosen.length > 0 ? shippingFee(goodsCents, shipping) : 0);
  const all = lines.length > 0 && chosen.length === lines.length;
  const href = `/s/${slug}/checkout?ids=${chosen.map((line) => line.id).join(",")}`;

  function toggle(id: string, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id));
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="flex flex-col gap-4 rounded-xl bg-background p-4">
          {lines.map((line) => (
            <OrderLine
              key={line.id}
              image={line.image}
              name={line.name}
              spec={line.spec}
              quantity={line.quantity}
              price={line.price}
              tags={line.tags}
              leading={<Checkbox checked={selected.includes(line.id)} onCheckedChange={(checked) => toggle(line.id, checked)} aria-label={`选择${line.name}`} />}
              trailing={(
                <form action={removeCartItem}>
                  <input type="hidden" name="id" value={line.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <Button type="submit" variant="ghost" size="icon-xs" aria-label="删除">
                    <Trash2Icon />
                  </Button>
                </form>
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t bg-background px-3 py-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={all} onCheckedChange={(checked) => setSelected(checked ? lines.map((line) => line.id) : [])} aria-label="全选" />
          <span className="text-sm text-muted-foreground">全选</span>
        </div>
        <p className="ml-auto text-right text-xs text-muted-foreground">
          已选{pieces}件 合计 <span className="text-lg font-semibold text-primary tabular-nums">{formatYuan(totalCents)}</span>
        </p>
        {chosen.length === 0 ? (
          <Button size="lg" className="shrink-0" disabled>结算</Button>
        ) : (
          <Button size="lg" className="shrink-0" nativeButton={false} render={<Link href={href} />}>结算</Button>
        )}
      </div>
    </div>
  );
}
