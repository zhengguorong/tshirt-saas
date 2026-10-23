import { NextResponse } from "next/server";
import { prisma } from "@tshirt/db";
import { parseDesignDocument } from "@tshirt/design";
import { getConsumer } from "@/server/auth";
import { getShop } from "@/server/catalog";
import { saveCartItem } from "@/server/commerce";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const shop = await getShop(slug);
    if (!shop || shop.status !== "ACTIVE") return NextResponse.json({ error: "店铺已暂停" }, { status: 404 });
    const consumer = await getConsumer();
    if (!consumer) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const body = (await request.json()) as {
      productId?: string;
      colorId?: string;
      sizeId?: string;
      quantity?: number;
      document?: unknown;
      replace?: boolean;
    };
    const parsed = parseDesignDocument(body.document);
    if (!parsed.success) return NextResponse.json({ error: "设计数据无效" }, { status: 400 });
    const item = await saveCartItem({
      tenantId: shop.id,
      consumerId: consumer.id,
      productId: body.productId || "",
      colorId: body.colorId || parsed.data.colorId,
      sizeId: body.sizeId || "",
      quantity: Number(body.quantity || 1),
      document: { ...parsed.data, colorId: body.colorId || parsed.data.colorId },
      replace: Boolean(body.replace),
    });
    return NextResponse.json({ id: item.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "加入购物车失败" }, { status: 400 });
  }
}
