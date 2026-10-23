import { NextResponse } from "next/server";
import { prisma } from "@tshirt/db";
import { readStorage, virtualShirtPng } from "@tshirt/production";
import { getConsumer, getStaff } from "@/server/auth";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (objectKey.startsWith("mockup/")) {
    const [, hex] = objectKey.split("/");
    const png = await virtualShirtPng(hex ?? "");
    return new NextResponse(new Uint8Array(png), {
      headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
    });
  }
  if (objectKey.includes("/orders/")) {
    const file = await prisma.productionFile.findFirst({
      where: { objectKey },
      include: { orderItem: { include: { order: true } } },
    });
    if (!file?.objectKey) return new NextResponse("not found", { status: 404 });
    const staff = await getStaff();
    const consumer = await getConsumer();
    const staffAllowed = staff?.tenantId === file.tenantId;
    const consumerAllowed = consumer?.id === file.orderItem.order.consumerId && file.kind === "preview";
    if (!staffAllowed && !consumerAllowed) return new NextResponse("not found", { status: 404 });
  }
  try {
    const body = await readStorage(objectKey);
    const type = objectKey.endsWith(".svg") ? "image/svg+xml" : objectKey.endsWith(".jpg") ? "image/jpeg" : "image/png";
    return new NextResponse(body, { headers: { "content-type": type } });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
