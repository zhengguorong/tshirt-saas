import { prisma } from "@tshirt/db";
import { SheetsView } from "@/components/admin/sheets-view";
import { getStaff } from "@/server/auth";
import { readItemIds, readSheetSizes } from "@/server/process-sheet";

export default async function SheetsPage() {
  const staff = await getStaff();
  if (!staff) return null;
  const sheets = await prisma.processSheet.findMany({
    where: { tenantId: staff.tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { order: { include: { items: { include: { files: true } } } } },
  });
  return (
    <SheetsView
      sheets={sheets.map((sheet) => {
        const ids = new Set(readItemIds(sheet.orderItemIds));
        const items = sheet.order.items.filter((item) => ids.has(item.id));
        const image = items.some((item) => item.fileStatus === "FAILED") ? "failed" : items.length > 0 && items.every((item) => item.fileStatus === "READY") ? "ready" : "pending";
        return {
          id: sheet.id,
          code: sheet.code,
          orderId: sheet.orderId,
          orderCode: sheet.order.code,
          productName: sheet.productName,
          colorName: sheet.colorName,
          colorHex: sheet.colorHex,
          sizes: readSheetSizes(sheet.sizes).map((size) => `${size.name} × ${size.quantity}`).join("、"),
          image,
          time: sheet.createdAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        };
      })}
    />
  );
}
