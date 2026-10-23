import { NextResponse } from "next/server";
import { getConsumer } from "@/server/auth";
import { payOrder } from "@/server/commerce";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const consumer = await getConsumer();
    if (!consumer) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const { id } = await context.params;
    await payOrder(id, consumer.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "支付失败" }, { status: 400 });
  }
}
