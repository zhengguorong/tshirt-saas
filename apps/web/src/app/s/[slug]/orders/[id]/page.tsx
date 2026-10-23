import { notFound } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { prisma } from "@tshirt/db";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { PayButton } from "@/components/session-buttons";
import { LoginWall } from "@/components/shop-login";
import { consumerCancel, consumerReceive } from "@/server/actions";
import { getConsumer } from "@/server/auth";
import { mediaUrl } from "@/server/catalog";
import { EVENT_LABEL } from "@/server/commerce";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrderDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const consumer = await getConsumer();
  if (!consumer) return <LoginWall next={`/s/${slug}/orders/${id}`} title="登录后查看这笔订单" />;
  const order = await prisma.order.findFirst({
    where: { id, consumerId: consumer.id },
    include: { tenant: true, items: { include: { files: true } }, shipment: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order || order.tenant.slug !== slug) notFound();
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{order.code}</h1>
          <p className="text-sm text-muted-foreground tabular-nums">应付 {formatYuan(order.totalCents)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      {order.items.map((item) => (
        <Card key={item.id} size="sm">
          <CardHeader>
            <CardTitle>{item.productName}</CardTitle>
            <CardDescription>{item.colorName} / {item.sizeName} × {item.quantity} · {formatYuan((item.unitBaseCents + item.unitPrintCents) * item.quantity)}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {item.files.filter((file) => file.kind === "preview" && file.objectKey).map((file) => (
              <img key={file.id} src={mediaUrl(file.objectKey || "")} alt="" className="h-28 rounded-lg border bg-muted object-contain" />
            ))}
          </CardContent>
        </Card>
      ))}
      <Card size="sm">
        <CardHeader>
          <CardTitle>收货与费用</CardTitle>
          <CardDescription>{order.receiverName} {order.receiverPhone}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>{order.province}{order.city}{order.district}{order.detail}</p>
          <p className="text-muted-foreground">底衫 {formatYuan(order.baseCents)} · 印刷 {formatYuan(order.printCents)} · 运费 {formatYuan(order.shippingCents)}</p>
          {order.shipment ? <p>{order.shipment.carrier} {order.shipment.trackingNo}</p> : null}
        </CardContent>
      </Card>
      {order.status === "WAIT_PAY" ? <PayButton orderId={order.id} /> : null}
      {order.status === "WAIT_PAY" ? (
        <form action={consumerCancel}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" variant="outline" className="w-full">取消订单</Button>
        </form>
      ) : null}
      {order.status === "WAIT_RECEIVE" ? (
        <form action={consumerReceive}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" className="w-full">确认收货</Button>
        </form>
      ) : null}
      <Card size="sm">
        <CardHeader>
          <CardTitle>进度</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {order.events.map((event) => <p key={event.id}>{EVENT_LABEL[event.event] || event.event} {event.note}</p>)}
        </CardContent>
      </Card>
      {order.status === "CLOSE" ? (
        <Alert>
          <AlertDescription>这笔订单已关闭。</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
