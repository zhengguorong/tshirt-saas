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
    <div className="flex flex-col gap-3 px-3 py-3">
      <h1 className="text-2xl font-semibold tracking-tight">我的订单</h1>
      {orders.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有订单</EmptyTitle>
            <EmptyDescription>设计一件 T 恤并完成支付后，订单会显示在这里。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : orders.map((order) => (
        <Link key={order.id} href={`/s/${slug}/orders/${order.id}`}>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{order.code}</span>
                <OrderStatusBadge status={order.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted-foreground">{order.items.map((item) => item.productName).join("、")}</span>
              <span className="shrink-0 tabular-nums">{formatYuan(order.totalCents)}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
