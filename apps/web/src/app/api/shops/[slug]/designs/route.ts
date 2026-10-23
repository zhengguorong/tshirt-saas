import { NextResponse } from "next/server";
import { prisma } from "@tshirt/db";
import { parseDesignDocument } from "@tshirt/design";
import { getConsumer } from "@/server/auth";
import { getShop } from "@/server/catalog";
import { assertDesign } from "@/server/commerce";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const consumer = await getConsumer();
    if (!consumer) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const { slug } = await context.params;
    const shop = await getShop(slug);
    if (!shop) return NextResponse.json({ error: "店铺不存在" }, { status: 404 });
    const body = (await request.json()) as { document?: unknown };
    const parsed = parseDesignDocument(body.document);
    if (!parsed.success) return NextResponse.json({ error: "设计无效" }, { status: 400 });
    await assertDesign(shop.id, parsed.data.productId, parsed.data);
    const design = await prisma.design.create({
      data: {
        tenantId: shop.id,
        consumerId: consumer.id,
        productId: parsed.data.productId,
        colorId: parsed.data.colorId,
        document: parsed.data,
      },
    });
    return NextResponse.json({ id: design.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
