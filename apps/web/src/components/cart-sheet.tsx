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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col bg-[#f5f3f0] lg:h-auto lg:max-w-[1600px] lg:bg-white lg:px-12 lg:pb-32 lg:pt-14">
      <div className="mb-6 hidden items-end justify-between lg:mb-14 lg:flex"><div><h1 className="text-3xl font-semibold lg:font-serif lg:text-5xl lg:font-normal lg:tracking-[0.08em]">购物车</h1><p className="mt-2 text-sm text-muted-foreground">共 {lines.length} 款商品，选择要结算的定制作品</p></div><Link href={`/s/${slug}#products`} className="text-sm text-muted-foreground hover:text-foreground">继续选购 →</Link></div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:overflow-visible lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] lg:items-start lg:gap-12 lg:p-0">
        <div className="store-cart-lines flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(30,24,18,0.06)] lg:gap-0 lg:rounded-none lg:p-0 lg:shadow-none">
          <label className="hidden items-center gap-3 border-b pb-4 text-sm lg:flex"><Checkbox checked={all} onCheckedChange={(checked) => setSelected(checked ? lines.map((line) => line.id) : [])} aria-label="全选商品" />全选商品<span className="ml-auto text-muted-foreground">已选 {pieces} 件</span></label>
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
        <aside className="hidden rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(30,24,18,0.06)] lg:sticky lg:top-28 lg:flex lg:flex-col lg:gap-10 lg:rounded-none lg:border-l lg:py-6 lg:pl-8 lg:pr-0 lg:shadow-none">
          <h2 className="text-lg font-semibold lg:font-normal">订单摘要</h2>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">商品小计</span><span>{formatYuan(goodsCents)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">运费</span><span>{chosen.length ? (shippingFee(goodsCents, shipping) ? formatYuan(shippingFee(goodsCents, shipping)) : "免邮") : "—"}</span></div>
          <div className="flex justify-between border-t pt-4 text-base font-semibold lg:mt-4 lg:pt-8 lg:text-xl lg:font-normal"><span>合计</span><span>{formatYuan(totalCents)}</span></div>
          {chosen.length === 0 ? <Button size="lg" className="lg:mt-3 lg:h-14 lg:rounded-none lg:text-base" disabled>去结算</Button> : <Button size="lg" className="bg-neutral-950 lg:mt-3 lg:h-14 lg:rounded-none lg:text-base" nativeButton={false} render={<Link href={href} />}>去结算</Button>}
        </aside>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t bg-background px-3 py-2 lg:hidden">
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
