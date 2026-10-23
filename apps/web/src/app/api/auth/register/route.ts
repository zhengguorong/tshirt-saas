import { NextResponse } from "next/server";
import { registerShop } from "@/server/register-shop";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      code?: string;
      name?: string;
      owner?: string;
      slug?: string;
    };
    const shop = await registerShop({
      phone: body.phone || "",
      code: body.code || "",
      name: body.name || "",
      owner: body.owner || "",
      slug: body.slug || "",
    });
    return NextResponse.json({ ok: true, slug: shop.slug });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "开店失败" }, { status: 400 });
  }
}
