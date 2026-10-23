import { formatYuan } from "@tshirt/design";
import { prisma, type OrderStatus } from "@tshirt/db";
import { OrdersView } from "@/components/admin/orders-view";
import { getStaff } from "@/server/auth";

export default async function AdminHome() {
  const staff = await getStaff();
  if (!staff) return null;
  const [orders, grouped] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId: staff.tenantId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { tenantId: staff.tenantId },
      _count: { _all: true },
    }),
  ]);
  const countOf = (status: OrderStatus) => grouped.find((row) => row.status === status)?._count._all ?? 0;

  return (
    <OrdersView
      counts={{
        WAIT_MANUFACTURE: countOf("WAIT_MANUFACTURE"),
        WAIT_PAY: countOf("WAIT_PAY"),
        WAIT_RECEIVE: countOf("WAIT_RECEIVE"),
        FINISH: countOf("FINISH"),
      }}
      orders={orders.map((order) => ({
        id: order.id,
        code: order.code,
        goods: order.items.map((item) => `${item.productName} ${item.sizeName} × ${item.quantity}`).join("、"),
        receiver: order.receiverName,
        status: order.status,
        total: formatYuan(order.totalCents),
        time: order.createdAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      }))}
    />
  );
}
