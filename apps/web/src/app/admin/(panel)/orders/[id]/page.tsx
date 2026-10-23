import { notFound } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { prisma } from "@tshirt/db";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { getStaff } from "@/server/auth";
import { mediaUrl } from "@/server/catalog";
import { EVENT_LABEL } from "@/server/commerce";

export default async function MerchantOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return null;
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, tenantId: staff.tenantId },
    include: { items: { include: { files: true } }, shipment: true, events: { orderBy: { createdAt: "asc" } }, processSheets: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  return (
    <OrderDetailView
      order={{
        id: order.id,
        code: order.code,
        status: order.status,
        createdAt: order.createdAt.toLocaleString("zh-CN"),
        total: formatYuan(order.totalCents),
        base: formatYuan(order.baseCents),
        print: formatYuan(order.printCents),
        shipping: formatYuan(order.shippingCents),
        receiverName: order.receiverName,
        receiverPhone: order.receiverPhone,
        address: `${order.province}${order.city}${order.district}${order.detail}`,
        shipment: order.shipment ? `${order.shipment.carrier} ${order.shipment.trackingNo}` : null,
        items: order.items.map((item) => ({
          id: item.id,
          title: item.productName,
          spec: `${item.colorName} / ${item.sizeName} × ${item.quantity}`,
          fileStatus: item.fileStatus === "READY" ? "已生成" : item.fileStatus === "FAILED" ? "失败" : "生成中",
          fileColor: item.fileStatus === "READY" ? "success" : item.fileStatus === "FAILED" ? "error" : "default",
          files: item.files.filter((file) => file.objectKey).map((file) => ({
            id: file.id,
            href: mediaUrl(file.objectKey || ""),
            label: `${file.kind === "print" ? "印刷图" : "效果图"} · ${file.surface === "FRONT" ? "正面" : "背面"}`,
          })),
        })),
        events: order.events.map((event) => ({
          id: event.id,
          label: `${EVENT_LABEL[event.event] || event.event}${event.note ? ` · ${event.note}` : ""}`,
          time: event.createdAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        })),
        sheets: order.processSheets.map((sheet) => ({ id: sheet.id, code: sheet.code })),
        canSheet: order.status !== "WAIT_PAY" && order.status !== "CANCEL",
      }}
    />
  );
}
