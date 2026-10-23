import { notFound } from "next/navigation";
import { prisma } from "@tshirt/db";
import { SheetDocument } from "@/components/admin/sheet-document";
import { getStaff } from "@/server/auth";
import { mediaUrl } from "@/server/catalog";
import { readItemIds, readSheetSizes } from "@/server/process-sheet";

export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return null;
  const { id } = await params;
  const sheet = await prisma.processSheet.findFirst({
    where: { id, tenantId: staff.tenantId },
    include: { order: { include: { items: { include: { files: true } } } } },
  });
  if (!sheet) notFound();
  const ids = new Set(readItemIds(sheet.orderItemIds));
  const items = sheet.order.items.filter((item) => ids.has(item.id));
  const picture = (surface: "FRONT" | "BACK", kind: "preview" | "print") => {
    for (const item of items) {
      const file = item.files.find((entry) => entry.surface === surface && entry.kind === kind && entry.objectKey && entry.status === "READY");
      if (file?.objectKey) return mediaUrl(file.objectKey);
    }
    return null;
  };
  return (
    <SheetDocument
      sheet={{
        code: sheet.code,
        orderId: sheet.orderId,
        orderCode: sheet.order.code,
        orderTime: sheet.order.createdAt.toLocaleString("zh-CN"),
        productName: sheet.productName,
        colorName: sheet.colorName,
        colorHex: sheet.colorHex,
        sizes: readSheetSizes(sheet.sizes).map((size) => `${size.name} × ${size.quantity}`).join("、"),
        receiverName: sheet.order.receiverName,
        receiverPhone: sheet.order.receiverPhone,
        address: `${sheet.order.province}${sheet.order.city}${sheet.order.district}${sheet.order.detail}`,
        sides: [
          { id: "front", title: "正面", preview: picture("FRONT", "preview"), print: picture("FRONT", "print") },
          { id: "back", title: "背面", preview: picture("BACK", "preview"), print: picture("BACK", "print") },
        ],
      }}
    />
  );
}
