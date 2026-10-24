import { notFound } from "next/navigation";
import { ChevronRightIcon, ClipboardListIcon, MapPinIcon, ShoppingBagIcon } from "lucide-react";
import type { OrderStatus } from "@tshirt/db";
import { prisma } from "@tshirt/db";
import { GuardedLink, LoginButton } from "@/components/shop-login";
import { LogoutButton } from "@/components/session-buttons";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getConsumer } from "@/server/auth";
import { getShop } from "@/server/catalog";
import { STATUS_LABEL } from "@/server/commerce";

const shortcuts: OrderStatus[] = ["WAIT_PAY", "WAIT_MANUFACTURE", "WAIT_RECEIVE", "FINISH"];

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  const consumer = await getConsumer();
  const grouped = consumer
    ? await prisma.order.groupBy({
      by: ["status"],
      where: { tenantId: shop.id, consumerId: consumer.id, status: { in: shortcuts } },
      _count: { _all: true },
    })
    : [];
  const countOf = (status: OrderStatus) => grouped.find((row) => row.status === status)?._count._all ?? 0;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 bg-[#f5f3f0] px-4 py-5 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-6 lg:px-12 lg:py-10">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-6 shadow-[0_8px_28px_rgba(30,24,18,0.06)] lg:row-span-2 lg:flex-col lg:items-start">
        <div className="flex size-12 items-center justify-center rounded-full bg-background text-sm font-semibold">
          {consumer ? consumer.phone.slice(-2) : "客"}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate font-medium">{consumer ? `${consumer.phone.slice(0, 3)}****${consumer.phone.slice(-4)}` : "未登录"}</p>
          <p className="truncate text-sm text-muted-foreground">{shop.name}</p>
        </div>
        {consumer ? <LogoutButton purpose="consumer" redirectTo={`/s/${slug}/account`} /> : (
          <LoginButton next={`/s/${slug}/account`}>登录</LoginButton>
        )}
      </div>
      <Card size="sm" className="rounded-2xl border-0 bg-white py-0 shadow-[0_8px_28px_rgba(30,24,18,0.06)]">
        <CardContent className="flex flex-col px-0">
          <GuardedLink authed={Boolean(consumer)} href={`/s/${slug}/orders`} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
            <span className="flex items-center gap-2 text-sm font-medium">
              <ClipboardListIcon className="size-4" />
              我的订单
            </span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </GuardedLink>
          <Separator />
          <div className="grid grid-cols-4 px-1 py-3">
            {shortcuts.map((status) => (
              <GuardedLink key={status} authed={Boolean(consumer)} href={`/s/${slug}/orders`} className="flex flex-col items-center gap-1 text-xs">
                <span className="text-base font-semibold tabular-nums">{consumer ? countOf(status) : "–"}</span>
                <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
              </GuardedLink>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card size="sm" className="rounded-2xl border-0 bg-white py-0 shadow-[0_8px_28px_rgba(30,24,18,0.06)]">
        <CardContent className="px-0">
          <GuardedLink authed={Boolean(consumer)} href={`/s/${slug}/cart`} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBagIcon className="size-4" />
              购物车
            </span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </GuardedLink>
          <Separator />
          <GuardedLink authed={Boolean(consumer)} href={`/s/${slug}/addresses`} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
            <span className="flex items-center gap-2 text-sm font-medium">
              <MapPinIcon className="size-4" />
              收货地址
            </span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </GuardedLink>
        </CardContent>
      </Card>
    </div>
  );
}
