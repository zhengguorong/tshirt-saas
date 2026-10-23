import { NextResponse } from "next/server";
import { prisma } from "@tshirt/db";
import { imageSize, writeStorage } from "@tshirt/production";
import { getConsumer, getStaff } from "@/server/auth";
import { getShop } from "@/server/catalog";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const slug = String(form.get("slug") || "");
    const shop = await getShop(slug);
    if (!shop || shop.status !== "ACTIVE") return NextResponse.json({ error: "店铺已暂停" }, { status: 404 });
    const staff = await getStaff();
    const consumer = await getConsumer();
    const asMaterial = form.get("source") === "material";
    if (asMaterial) {
      if (!staff || staff.tenantId !== shop.id || staff.role !== "OWNER") {
        return NextResponse.json({ error: "只有店主可以上传素材" }, { status: 403 });
      }
    } else if (!consumer) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (!(file instanceof File)) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "图片不能超过 15MB" }, { status: 400 });
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      return NextResponse.json({ error: "只支持 PNG 和 JPG" }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const size = await imageSize(bytes);
    const id = crypto.randomUUID();
    const ext = file.type === "image/png" ? "png" : "jpg";
    const folder = asMaterial ? "materials" : "uploads";
    const objectKey = `tenants/${shop.id}/${folder}/${id}.${ext}`;
    await writeStorage(objectKey, bytes);
    const asset = await prisma.asset.create({
      data: {
        tenantId: shop.id,
        source: asMaterial ? "MATERIAL" : "UPLOAD",
        name: String(form.get("name") || file.name),
        objectKey,
        width: size.width,
        height: size.height,
        status: "ON",
      },
    });
    return NextResponse.json({ id: asset.id, width: asset.width, height: asset.height, objectKey });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "上传失败" }, { status: 400 });
  }
}
