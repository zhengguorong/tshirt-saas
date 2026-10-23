"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@tshirt/db";
import { yuanToCents } from "@tshirt/design";
import { getPlatformAdmin, getStaff, isOwner } from "./auth";
import { assertShopSlug, normalizeDomain } from "./tenant";
import { addColor, createProduct, setSizeAvailable, updateProductBasics } from "./catalog";
import { cancelOrder, createOrder, receiveOrder, refundOrder, shipOrder } from "./commerce";
import { getConsumer } from "./auth";

function failure(error: unknown) {
  return { error: error instanceof Error ? error.message : "操作失败" };
}

function returnPath(slug: string, next: string, addressId?: string) {
  if (!next.startsWith(`/s/${slug}`)) return `/s/${slug}/addresses`;
  if (!next.includes("/checkout")) return next;
  const url = new URL(next, "http://local");
  if (addressId) url.searchParams.set("addressId", addressId);
  else url.searchParams.delete("addressId");
  return `${url.pathname}${url.search}`;
}

export async function placeOrder(_prev: { error?: string } | null, formData: FormData) {
  const slug = String(formData.get("slug") || "");
  try {
    const consumer = await getConsumer();
    if (!consumer) throw new Error("请先登录");
    const shop = await prisma.tenant.findUnique({ where: { slug } });
    if (!shop) throw new Error("店铺不存在");
    const order = await createOrder({
      tenantId: shop.id,
      consumerId: consumer.id,
      receiverName: String(formData.get("name") || ""),
      receiverPhone: String(formData.get("phone") || ""),
      province: String(formData.get("province") || ""),
      city: String(formData.get("city") || ""),
      district: String(formData.get("district") || ""),
      detail: String(formData.get("detail") || ""),
      saveAddress: formData.get("saveAddress") === "on",
      itemIds: String(formData.get("ids") || "").split(",").map((id) => id.trim()).filter(Boolean),
    });
    redirect(`/s/${slug}/orders/${order.id}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return failure(error);
  }
}

export async function saveAddress(_prev: { error?: string } | null, formData: FormData) {
  const slug = String(formData.get("slug") || "");
  try {
    const consumer = await getConsumer();
    if (!consumer) throw new Error("请先登录");
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const province = String(formData.get("province") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const district = String(formData.get("district") || "").trim();
    const detail = String(formData.get("detail") || "").trim();
    const id = String(formData.get("id") || "");
    if (!name) throw new Error("收货姓名不能为空");
    if (!/^1\d{10}$/.test(phone)) throw new Error("手机号码错误");
    if (!province || !city || !district) throw new Error("所在地区不能为空");
    if (!detail) throw new Error("详细地址不能为空");
    if (detail.length < 4) throw new Error("详细地址至少 4 个字");
    const count = await prisma.address.count({ where: { consumerId: consumer.id } });
    const isDefault = formData.get("isDefault") === "on" || count === 0 || Boolean(id && count === 1);
    const saved = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { consumerId: consumer.id }, data: { isDefault: false } });
      if (id) {
        const current = await tx.address.findFirst({ where: { id, consumerId: consumer.id } });
        if (!current) throw new Error("地址不存在");
        return tx.address.update({ where: { id }, data: { name, phone, province, city, district, detail, isDefault } });
      }
      return tx.address.create({ data: { consumerId: consumer.id, name, phone, province, city, district, detail, isDefault } });
    });
    redirect(returnPath(slug, String(formData.get("next") || ""), saved.id));
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return failure(error);
  }
}

export async function deleteAddress(formData: FormData) {
  const consumer = await getConsumer();
  if (!consumer) throw new Error("请先登录");
  const slug = String(formData.get("slug") || "");
  const id = String(formData.get("id") || "");
  const current = await prisma.address.findFirst({ where: { id, consumerId: consumer.id } });
  if (current) {
    await prisma.address.delete({ where: { id } });
    if (current.isDefault) {
      const fallback = await prisma.address.findFirst({ where: { consumerId: consumer.id }, orderBy: { createdAt: "desc" } });
      if (fallback) await prisma.address.update({ where: { id: fallback.id }, data: { isDefault: true } });
    }
  }
  const next = String(formData.get("next") || "");
  redirect(next.includes("/checkout") ? returnPath(slug, next) : `/s/${slug}/addresses${next.startsWith(`/s/${slug}`) ? `?next=${encodeURIComponent(next)}` : ""}`);
}

export async function removeCartItem(formData: FormData) {
  const consumer = await getConsumer();
  if (!consumer) throw new Error("请先登录");
  const slug = String(formData.get("slug"));
  await prisma.cartItem.deleteMany({ where: { id: String(formData.get("id")), consumerId: consumer.id } });
  revalidatePath(`/s/${slug}/cart`);
}

export async function consumerCancel(formData: FormData) {
  const consumer = await getConsumer();
  if (!consumer) throw new Error("请先登录");
  const orderId = String(formData.get("orderId"));
  const slug = String(formData.get("slug"));
  await cancelOrder(orderId, consumer.id);
  revalidatePath(`/s/${slug}/orders/${orderId}`);
}

export async function consumerReceive(formData: FormData) {
  const consumer = await getConsumer();
  if (!consumer) throw new Error("请先登录");
  const orderId = String(formData.get("orderId"));
  const slug = String(formData.get("slug"));
  await receiveOrder(orderId, consumer.id);
  revalidatePath(`/s/${slug}/orders/${orderId}`);
}

export async function createProductAction(_prev: { error?: string } | null, formData: FormData) {
  try {
    const staff = await getStaff();
    if (!staff || !isOwner(staff.role)) throw new Error("只有店主可以新建底衫");
    const colors = [
      { name: String(formData.get("colorName") || ""), hex: String(formData.get("colorHex") || "") },
      { name: String(formData.get("color2Name") || ""), hex: String(formData.get("color2Hex") || "") },
    ].filter((color) => color.name.trim() || color.hex.trim());
    const product = await createProduct({
      tenantId: staff.tenantId,
      name: String(formData.get("name") || ""),
      detail: String(formData.get("detail") || ""),
      priceYuan: Number(formData.get("priceYuan")),
      sizes: String(formData.get("sizes") || "S,M,L,XL").split(/[,，\s]+/).map((size) => size.trim()).filter(Boolean),
      colors,
      enableBack: formData.get("enableBack") === "on",
      frontSurchargeYuan: Number(formData.get("frontSurchargeYuan") || 0),
      backSurchargeYuan: Number(formData.get("backSurchargeYuan") || 0),
      publish: formData.get("publish") === "on",
    });
    redirect(`/admin/products/${product.id}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return failure(error);
  }
}

export async function updateProductAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff || !isOwner(staff.role)) throw new Error("只有店主可以改价格");
  const productId = String(formData.get("productId"));
  await updateProductBasics({
    tenantId: staff.tenantId,
    productId,
    name: String(formData.get("name") || ""),
    detail: String(formData.get("detail") || ""),
    priceYuan: Number(formData.get("priceYuan")),
    publish: formData.get("publish") === "on",
    frontSurchargeYuan: Number(formData.get("frontSurchargeYuan") || 0),
    backSurchargeYuan: Number(formData.get("backSurchargeYuan") || 0),
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function addColorAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff || !isOwner(staff.role)) throw new Error("只有店主可以添加颜色");
  const productId = String(formData.get("productId"));
  await addColor(staff.tenantId, productId, String(formData.get("name") || ""), String(formData.get("hex") || ""));
  revalidatePath(`/admin/products/${productId}`);
}

export async function toggleSizeAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff || !isOwner(staff.role)) throw new Error("只有店主可以修改尺码");
  await setSizeAvailable(staff.tenantId, String(formData.get("sizeId")), formData.get("available") === "true");
  revalidatePath("/admin/products");
}

export async function saveSettingsAction(_prev: { error?: string; saved?: boolean } | null, formData: FormData) {
  try {
    const staff = await getStaff();
    if (!staff || !isOwner(staff.role)) throw new Error("只有店主可以修改店铺");
    const shippingType = String(formData.get("shippingType")) === "FREE_OVER" ? "FREE_OVER" : "FLAT";
    const customDomain = normalizeDomain(String(formData.get("customDomain") || ""));
    if (customDomain) {
      const clash = await prisma.tenant.findFirst({
        where: { customDomain, NOT: { id: staff.tenantId } },
        select: { id: true },
      });
      if (clash) throw new Error("这个域名已经绑定到别的店铺");
    }
    await prisma.tenant.update({
      where: { id: staff.tenantId },
      data: {
        name: String(formData.get("name") || staff.tenant.name),
        description: String(formData.get("description") || ""),
        contact: String(formData.get("contact") || ""),
        customDomain,
        shippingType,
        flatShippingCents: yuanToCents(Number(formData.get("flatYuan") || 0)),
        freeShippingThresholdCents: shippingType === "FREE_OVER" ? yuanToCents(Number(formData.get("thresholdYuan") || 0)) : null,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath(`/s/${staff.tenant.slug}`);
    return { saved: true };
  } catch (error) {
    return failure(error);
  }
}

export async function shipAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff) throw new Error("请先登录");
  const orderId = String(formData.get("orderId"));
  await shipOrder(orderId, staff.tenantId, staff.id, String(formData.get("carrier") || ""), String(formData.get("trackingNo") || ""));
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function refundAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff) throw new Error("请先登录");
  const orderId = String(formData.get("orderId"));
  await refundOrder(orderId, staff.tenantId, staff.id, String(formData.get("note") || ""));
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function retryRenderAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff) throw new Error("请先登录");
  const orderId = String(formData.get("orderId"));
  const { retryRender } = await import("./commerce");
  await retryRender(orderId, staff.tenantId);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function generateSheetsAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff) throw new Error("请先登录");
  const orderId = String(formData.get("orderId"));
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId: staff.tenantId }, select: { id: true } });
  if (!order) throw new Error("订单不存在");
  const { createProcessSheets } = await import("./commerce");
  await createProcessSheets(order.id, { actorType: "STAFF", actorId: staff.id });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/sheets");
}

export async function createTenantAction(_prev: { error?: string } | null, formData: FormData) {
  try {
    const admin = await getPlatformAdmin();
    if (!admin) throw new Error("请先登录平台");
    const slug = assertShopSlug(String(formData.get("slug") || ""));
    const phone = String(formData.get("phone") || "");
    const name = String(formData.get("name") || "").trim();
    const owner = String(formData.get("owner") || "").trim();
    if (!/^1\d{10}$/.test(phone)) throw new Error("店主手机号不正确");
    if (!name || !owner) throw new Error("请填写店铺名和店主姓名");
    const existing = await prisma.staff.findFirst({ where: { phone }, select: { id: true } });
    if (existing) throw new Error("这个手机号已经开过店");
    await prisma.tenant.create({
      data: {
        slug,
        name,
        staff: { create: { phone, name: owner, role: "OWNER" } },
      },
    });
    redirect("/platform");
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return failure(error);
  }
}

export async function setTenantStateAction(formData: FormData) {
  const admin = await getPlatformAdmin();
  if (!admin) throw new Error("请先登录平台");
  const tenantId = String(formData.get("tenantId"));
  const status = String(formData.get("status")) === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  await prisma.tenant.update({ where: { id: tenantId }, data: { status } });
  revalidatePath("/platform");
}
