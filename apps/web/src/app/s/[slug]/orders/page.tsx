import Link from "next/link";
import { redirect } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { prisma } from "@tshirt/db";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { LoginWall } from "@/components/shop-login";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getConsumer } from "@/server/auth";
import { getShop } from "@/server/catalog";

export default async function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const consumer = await getConsumer();
  if (!consumer) return <LoginWall next={`/s/${slug}/orders`} title="登录后查看订单" />;
  const shop = await getShop(slug);
  if (!shop) redirect("/");
  const orders = await prisma.order.findMany({
    where: { tenantId: shop.id, consumerId: consumer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 bg-[#f5f3f0] px-4 py-5 lg:px-12 lg:py-10">
      <div><h1 className="text-2xl font-semibold tracking-tight">我的订单</h1><p className="mt-1 text-sm text-muted-foreground">查看订单状态与物流进度</p></div>
      {orders.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有订单</EmptyTitle>
            <EmptyDescription>设计一件 T 恤并完成支付后，订单会显示在这里。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : orders.map((order) => (
        <Link key={order.id} href={`/s/${slug}/orders/${order.id}`}>
          <Card size="sm" className="rounded-2xl border-0 bg-white py-5 shadow-[0_8px_28px_rgba(30,24,18,0.06)] transition hover:-translate-y-0.5">
            <CardHeader className="pb-1"><CardTitle className="flex items-center justify-between gap-2"><span className="text-base">{order.code}</span>
                <OrderStatusBadge status={order.status} />
              </CardTitle>
              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-muted-foreground">{order.items.map((item) => item.productName).join("、")}</span><span className="shrink-0 font-medium tabular-nums">{formatYuan(order.totalCents)} <span className="ml-2 text-muted-foreground">查看详情 →</span></span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
