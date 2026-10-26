"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ChevronDownIcon, ChevronRightIcon, MapPinIcon, PlusIcon } from "lucide-react";
import { placeOrder } from "@/server/actions";
import { OrderLine } from "@/components/order-line";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CheckoutForm({
  slug,
  ids,
  addressHref,
  address,
  lines,
  summary,
}: {
  slug: string;
  ids: string;
  addressHref: string;
  address: { name: string; phone: string; province: string; city: string; district: string; detail: string } | null;
  lines: { id: string; name: string; spec: string; quantity: number; image: string | null; price: string; tags: string[] }[];
  summary: { styles: number; quantity: number; total: string; base: string; print: string; shipping: string };
}) {
  const [state, action, pending] = useActionState(placeOrder, null);
  const [open, setOpen] = useState(true);
  const detail = address ? `${address.province}${address.city}${address.district}${address.detail}` : "";
  return (
    <form action={action} className="store-checkout mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col bg-[#f5f3f0] lg:h-auto lg:max-w-7xl lg:px-8 lg:py-10">
      <div className="mb-6 hidden lg:block"><h1 className="text-3xl font-semibold">确认订单</h1><p className="mt-2 text-sm text-muted-foreground">确认收货信息与定制商品后提交订单</p></div>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="ids" value={ids} />
      <div className="store-checkout-columns flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:overflow-visible lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6 lg:p-0">
        {address ? (
          <>
            <Link href={addressHref} className="lg:col-start-1 flex w-full items-center gap-3 rounded-2xl bg-white px-5 py-5 shadow-[0_8px_28px_rgba(30,24,18,0.06)]">
              <MapPinIcon className="size-5 shrink-0 text-primary" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="truncate">{address.name}</span>
                  <span className="shrink-0">{address.phone}</span>
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">{detail}</span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
            <input type="hidden" name="name" value={address.name} />
            <input type="hidden" name="phone" value={address.phone} />
            <input type="hidden" name="province" value={address.province} />
            <input type="hidden" name="city" value={address.city} />
            <input type="hidden" name="district" value={address.district} />
            <input type="hidden" name="detail" value={address.detail} />
          </>
        ) : (
          <Link href={addressHref} className="lg:col-start-1 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm text-muted-foreground shadow-[0_8px_28px_rgba(30,24,18,0.06)]">
            <PlusIcon className="size-4" />
            添加收货地址
          </Link>
        )}
        <div className="lg:col-start-1 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(30,24,18,0.06)]">
          {lines.map((line) => (
            <OrderLine key={line.id} image={line.image} name={line.name} spec={line.spec} quantity={line.quantity} price={line.price} tags={line.tags} />
          ))}
        </div>
        <div className="store-checkout-summary flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(30,24,18,0.06)] lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <button type="button" className="flex items-center justify-between gap-3" onClick={() => setOpen((value) => !value)}>
            <span className="text-sm font-medium">实付金额</span>
            <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
              {summary.total}
              <ChevronDownIcon className={open ? "size-4 rotate-180" : "size-4"} />
            </span>
          </button>
          {open ? (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">商品总价</span><span className="tabular-nums">{summary.base}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">印花加价</span><span className="tabular-nums">{summary.print}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">快递费用</span><span className="tabular-nums">{summary.shipping}</span></div>
            </div>
          ) : null}
          <div className="mt-3 hidden flex-col gap-4 border-t pt-5 lg:flex"><p className="text-sm text-muted-foreground">{summary.styles}款，共{summary.quantity}件</p><Button type="submit" size="lg" className="w-full bg-neutral-950" disabled={pending}>{pending ? "提交中" : "提交订单"}</Button></div>
        </div>
        {state?.error ? <Alert className="lg:col-start-1" variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t bg-background px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs text-muted-foreground">{summary.styles}款，共{summary.quantity}件</p>
          <p className="text-xs text-muted-foreground">合计 <span className="text-lg font-semibold text-primary tabular-nums">{summary.total}</span></p>
        </div>
        <Button type="submit" size="lg" className="shrink-0 bg-neutral-950" disabled={pending}>{pending ? "提交中" : "提交订单"}</Button>
      </div>
    </form>
  );
}
