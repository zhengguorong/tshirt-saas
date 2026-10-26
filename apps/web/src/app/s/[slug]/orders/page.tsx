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
    <div className="store-member-page store-orders mx-auto flex w-full max-w-5xl flex-col gap-5 bg-[#f5f3f0] px-4 py-5 lg:max-w-none lg:px-0 lg:py-0">
      <div><h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">我的订单</h1><p className="mt-1 text-sm text-muted-foreground">查看订单状态与物流进度</p></div>
      <div className="store-orders-heading hidden grid-cols-[minmax(130px,1fr)_minmax(0,1.4fr)_90px_160px] gap-4 px-5 text-xs text-muted-foreground lg:grid"><span>订单编号 / 下单时间</span><span>商品</span><span>状态</span><span className="text-right">实付 / 操作</span></div>
      {orders.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <span className="hidden lg:mb-3 lg:block lg:text-xs lg:tracking-[0.2em] lg:text-neutral-400">你的定制旅程</span>
            <EmptyTitle>还没有订单</EmptyTitle>
            <EmptyDescription>设计一件 T 恤并完成支付后，订单会显示在这里。</EmptyDescription>
            <Link href={`/s/${slug}#products`} className="store-desktop-cta hidden lg:mt-6 lg:inline-flex">去选购 →</Link>
          </EmptyHeader>
        </Empty>
      ) : orders.map((order) => (
        <Link key={order.id} href={`/s/${slug}/orders/${order.id}`}>
          <Card size="sm" className="store-order-row rounded-2xl border-0 bg-white py-5 shadow-[0_8px_28px_rgba(30,24,18,0.06)] transition hover:-translate-y-0.5 lg:grid lg:grid-cols-[minmax(130px,1fr)_minmax(0,1.4fr)_90px_160px] lg:items-center lg:gap-x-4 lg:gap-y-1 lg:px-5">
            <CardHeader className="pb-1 lg:contents"><CardTitle className="flex items-center justify-between gap-2 lg:contents"><span className="text-base lg:col-start-1 lg:row-start-1 lg:text-sm">{order.code}</span>
                <span className="lg:col-start-3 lg:row-span-2 lg:row-start-1"><OrderStatusBadge status={order.status} /></span>
              </CardTitle>
              <p className="text-xs text-muted-foreground lg:col-start-1 lg:row-start-2">{new Date(order.createdAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm lg:contents"><span className="truncate text-muted-foreground lg:col-start-2 lg:row-span-2 lg:row-start-1">{order.items.map((item) => item.productName).join("、")}</span><span className="shrink-0 font-medium tabular-nums lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:text-right">{formatYuan(order.totalCents)} <span className="ml-2 text-muted-foreground lg:mt-1 lg:block">查看详情 →</span></span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
