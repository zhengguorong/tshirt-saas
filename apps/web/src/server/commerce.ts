import { createHash } from "node:crypto";
import { prisma, type OrderStatus, type Surface } from "@tshirt/db";
import { linePrice, orderPrice, parseDesignDocument, usedSurfaces, type DesignDocumentV1, type SurfaceId } from "@tshirt/design";
import { createOrderCode, transition } from "@tshirt/order";
import { enqueueRender, renderOrderItem } from "@tshirt/production";
import { getProduct, toSurfaceId } from "./catalog";

const ORDER_MINUTES = 30;

function areasForPrice(printAreas: Array<{ surface: Surface; surchargeCents: number }>) {
  return printAreas.map((area) => ({ surface: toSurfaceId(area.surface), surchargeCents: area.surchargeCents }));
}

function snapshotOf(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>, colorId: string) {
  const color = product.colors.find((item) => item.id === colorId);
  if (!color) throw new Error("颜色不存在");
  return {
    colorHex: color.hex,
    frontMockupKey: color.frontMockupKey,
    backMockupKey: color.backMockupKey,
    areas: product.printAreas.map((area) => ({
      surface: toSurfaceId(area.surface),
      x: area.x,
      y: area.y,
      w: area.w,
      h: area.h,
      exportWidth: area.exportWidth,
      exportHeight: area.exportHeight,
      surchargeCents: area.surchargeCents,
    })),
  };
}

export async function assertDesign(tenantId: string, productId: string, document: DesignDocumentV1) {
  const product = await getProduct(tenantId, productId, false);
  if (!product) throw new Error("底衫不存在");
  if (document.productId !== product.id) throw new Error("设计与底衫不匹配");
  if (!product.colors.some((color) => color.id === document.colorId)) throw new Error("颜色不存在");
  const configured = new Set(product.printAreas.map((area) => toSurfaceId(area.surface)));
  for (const surface of usedSurfaces(document)) {
    if (!configured.has(surface)) throw new Error("这件底衫没有该印刷面");
  }
  const assetIds = usedSurfaces(document).flatMap((surface) =>
    (document.surfaces[surface]?.elements ?? []).flatMap((element) => (element.type === "image" ? [element.assetId] : [])),
  );
  if (assetIds.length) {
    const count = await prisma.asset.count({ where: { tenantId, id: { in: assetIds } } });
    if (count !== new Set(assetIds).size) throw new Error("有图片不属于这家店");
  }
  return product;
}

export async function saveCartItem(input: {
  tenantId: string;
  consumerId: string;
  productId: string;
  colorId: string;
  sizeId: string;
  quantity: number;
  document: DesignDocumentV1;
  replace: boolean;
}) {
  const product = await assertDesign(input.tenantId, input.productId, input.document);
  if (product.status !== "ON") throw new Error("底衫已下架");
  const size = product.sizes.find((item) => item.id === input.sizeId && item.available);
  if (!size) throw new Error("尺码不可售");
  if (input.replace) {
    await prisma.cartItem.deleteMany({ where: { tenantId: input.tenantId, consumerId: input.consumerId } });
  }
  return prisma.cartItem.create({
    data: {
      tenantId: input.tenantId,
      consumerId: input.consumerId,
      productId: product.id,
      colorId: input.colorId,
      sizeId: size.id,
      quantity: input.quantity,
      document: input.document,
    },
  });
}

export async function getCart(tenantId: string, consumerId: string) {
  return prisma.cartItem.findMany({
    where: { tenantId, consumerId },
    include: { product: { include: { colors: true, sizes: true, printAreas: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export function describeCartItem(item: Awaited<ReturnType<typeof getCart>>[number]) {
  const parsed = parseDesignDocument(item.document);
  const color = item.product.colors.find((entry) => entry.id === item.colorId);
  const size = item.product.sizes.find((entry) => entry.id === item.sizeId);
  const priced = parsed.success
    ? linePrice({
        baseCents: item.product.priceCents,
        quantity: item.quantity,
        document: parsed.data,
        areas: areasForPrice(item.product.printAreas),
      })
    : null;
  return {
    id: item.id,
    name: item.product.name,
    spec: [color?.name, size?.name].filter(Boolean).join("；"),
    quantity: item.quantity,
    imageKey: color?.frontMockupKey ?? null,
    goodsCents: priced?.goodsCents ?? item.product.priceCents * item.quantity,
    tags: (priced?.usedSurfaces ?? []).map((surface) => (surface === "front" ? "正面" : "背面")),
  };
}

export async function quoteCart(tenantId: string, consumerId: string, itemIds?: string[]) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("店铺不存在");
  const cart = await getCart(tenantId, consumerId);
  const items = itemIds ? cart.filter((item) => itemIds.includes(item.id)) : cart;
  const lines = items.map((item) => {
    const parsed = parseDesignDocument(item.document);
    if (!parsed.success) throw new Error("购物车里有无效设计");
    return {
      baseCents: item.product.priceCents,
      quantity: item.quantity,
      document: parsed.data,
      areas: areasForPrice(item.product.printAreas),
    };
  });
  const price = lines.length
    ? orderPrice({
        lines,
        shipping: {
          type: tenant.shippingType,
          flatCents: tenant.flatShippingCents,
          thresholdCents: tenant.freeShippingThresholdCents,
        },
      })
    : { baseCents: 0, printCents: 0, goodsCents: 0, shippingCents: 0, totalCents: 0 };
  return { tenant, items, price };
}

export async function createOrder(input: {
  tenantId: string;
  consumerId: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  saveAddress: boolean;
  itemIds: string[];
}) {
  if (!input.receiverName.trim() || !/^1\d{10}$/.test(input.receiverPhone)) throw new Error("请填写收货人和手机号");
  if (!input.province || !input.city || !input.district || !input.detail.trim()) throw new Error("请填写完整地址");
  const quoted = await quoteCart(input.tenantId, input.consumerId, input.itemIds);
  if (quoted.items.length === 0) throw new Error("购物车是空的");
  if (quoted.tenant.status !== "ACTIVE") throw new Error("店铺已暂停");
  if (quoted.price.totalCents <= 0) throw new Error("订单金额需要大于 0");

  for (const item of quoted.items) {
    if (item.product.status !== "ON") throw new Error(`${item.product.name} 已下架`);
    const parsed = parseDesignDocument(item.document);
    if (!parsed.success) throw new Error("设计无效");
    await assertDesign(input.tenantId, item.productId, parsed.data);
  }

  const order = await prisma.$transaction(async (tx) => {
    if (input.saveAddress) {
      await tx.address.updateMany({ where: { consumerId: input.consumerId }, data: { isDefault: false } });
      await tx.address.create({
        data: {
          consumerId: input.consumerId,
          name: input.receiverName.trim(),
          phone: input.receiverPhone,
          province: input.province.trim(),
          city: input.city.trim(),
          district: input.district.trim(),
          detail: input.detail.trim(),
          isDefault: true,
        },
      });
    }
    let created = null;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      try {
        created = await tx.order.create({
          data: {
            tenantId: input.tenantId,
            consumerId: input.consumerId,
            code: createOrderCode(),
            status: "WAIT_PAY",
            baseCents: quoted.price.baseCents,
            printCents: quoted.price.printCents,
            shippingCents: quoted.price.shippingCents,
            totalCents: quoted.price.totalCents,
            receiverName: input.receiverName.trim(),
            receiverPhone: input.receiverPhone,
            province: input.province.trim(),
            city: input.city.trim(),
            district: input.district.trim(),
            detail: input.detail.trim(),
            expiresAt: new Date(Date.now() + ORDER_MINUTES * 60 * 1000),
            payment: { create: { tenantId: input.tenantId, channel: "FAKE", amountCents: quoted.price.totalCents } },
            events: { create: { tenantId: input.tenantId, actorType: "CONSUMER", actorId: input.consumerId, event: "create", note: "提交订单" } },
            items: {
              create: quoted.items.map((item) => {
                const parsed = parseDesignDocument(item.document);
                if (!parsed.success) throw new Error("设计无效");
                const color = item.product.colors.find((entry) => entry.id === item.colorId);
                const size = item.product.sizes.find((entry) => entry.id === item.sizeId);
                const line = orderPrice({
                  lines: [{ baseCents: item.product.priceCents, quantity: item.quantity, document: parsed.data, areas: areasForPrice(item.product.printAreas) }],
                  shipping: { type: "FLAT", flatCents: 0, thresholdCents: null },
                });
                return {
                  tenantId: input.tenantId,
                  productId: item.productId,
                  productName: item.product.name,
                  colorName: color?.name ?? "",
                  colorHex: color?.hex ?? "#FFFFFF",
                  sizeName: size?.name ?? "",
                  quantity: item.quantity,
                  unitBaseCents: item.product.priceCents,
                  unitPrintCents: Math.round(line.printCents / item.quantity),
                  document: parsed.data,
                  snapshot: snapshotOf(item.product, item.colorId),
                };
              }),
            },
          },
        });
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
    if (!created) throw new Error("创建订单失败");
    await tx.cartItem.deleteMany({ where: { tenantId: input.tenantId, consumerId: input.consumerId, id: { in: quoted.items.map((item) => item.id) } } });
    return created;
  });
  return order;
}

export async function payOrder(orderId: string, consumerId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, consumerId }, include: { items: true } });
  if (!order) throw new Error("订单不存在");
  if (order.status === "WAIT_MANUFACTURE" || order.status === "WAIT_RECEIVE" || order.status === "FINISH") return order;
  if (order.status !== "WAIT_PAY") throw new Error("订单不能支付");
  if (order.expiresAt.getTime() < Date.now()) throw new Error("订单已超时");
  const tenant = await prisma.tenant.findUnique({ where: { id: order.tenantId } });
  if (!tenant || tenant.status !== "ACTIVE") throw new Error("店铺已暂停");
  for (const item of order.items) {
    const product = await prisma.product.findFirst({ where: { id: item.productId, tenantId: order.tenantId, status: "ON" } });
    if (!product) throw new Error(`${item.productName} 已下架`);
  }

  const paid = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id: order.id, status: "WAIT_PAY" }, data: { status: transition("WAIT_PAY", "pay") } });
    if (updated.count === 0) return false;
    await tx.payment.update({
      where: { orderId: order.id },
      data: { status: "PAID", channel: "FAKE", providerTransactionId: `fake_${order.id}` },
    });
    await tx.orderEvent.create({
      data: { orderId: order.id, tenantId: order.tenantId, actorType: "CONSUMER", actorId: consumerId, event: "pay", note: "模拟支付成功" },
    });
    return true;
  });
  if (paid) {
    for (const item of order.items) {
      const queued = await enqueueRender(item.id);
      if (!queued) {
        try {
          await renderOrderItem(item.id);
        } catch (error) {
          console.error(error);
        }
      }
    }
    await createProcessSheets(order.id, { actorType: "SYSTEM" }).catch((error) => console.error(error));
  }
  return prisma.order.findUnique({ where: { id: order.id } });
}

async function changeOrder(input: { orderId: string; tenantId?: string; consumerId?: string; event: "cancel" | "ship" | "receive" | "refund"; actorType: "CONSUMER" | "STAFF"; actorId: string; note?: string; carrier?: string; trackingNo?: string }) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, ...(input.tenantId ? { tenantId: input.tenantId } : {}), ...(input.consumerId ? { consumerId: input.consumerId } : {}) },
  });
  if (!order) throw new Error("订单不存在");
  const next = transition(order.status, input.event);
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: next } });
    if (updated.count === 0) throw new Error("订单状态已变化");
    if (input.event === "ship") {
      await tx.shipment.create({
        data: { orderId: order.id, tenantId: order.tenantId, carrier: input.carrier || "", trackingNo: input.trackingNo || "" },
      });
    }
    if (input.event === "refund") {
      await tx.payment.update({ where: { orderId: order.id }, data: { status: "REFUNDED" } });
    }
    if (input.event === "cancel") {
      await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED" } });
    }
    await tx.orderEvent.create({
      data: { orderId: order.id, tenantId: order.tenantId, actorType: input.actorType, actorId: input.actorId, event: input.event, note: input.note || "" },
    });
  });
}

export async function cancelOrder(orderId: string, consumerId: string) {
  await changeOrder({ orderId, consumerId, event: "cancel", actorType: "CONSUMER", actorId: consumerId, note: "用户取消" });
}

export async function receiveOrder(orderId: string, consumerId: string) {
  await changeOrder({ orderId, consumerId, event: "receive", actorType: "CONSUMER", actorId: consumerId, note: "确认收货" });
}

export async function shipOrder(orderId: string, tenantId: string, staffId: string, carrier: string, trackingNo: string) {
  if (!carrier.trim() || !trackingNo.trim()) throw new Error("请填写快递公司和运单号");
  await changeOrder({
    orderId,
    tenantId,
    event: "ship",
    actorType: "STAFF",
    actorId: staffId,
    carrier: carrier.trim(),
    trackingNo: trackingNo.trim(),
    note: `${carrier.trim()} ${trackingNo.trim()}`,
  });
}

export async function refundOrder(orderId: string, tenantId: string, staffId: string, note: string) {
  if (!note.trim()) throw new Error("请填写退款原因");
  await changeOrder({ orderId, tenantId, event: "refund", actorType: "STAFF", actorId: staffId, note: note.trim() });
}

export async function retryRender(orderId: string, tenantId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId, tenantId } });
  if (items.length === 0) throw new Error("订单不存在");
  for (const item of items) {
    await prisma.orderItem.update({ where: { id: item.id }, data: { fileStatus: "PENDING" } });
    const queued = await enqueueRender(item.id);
    if (!queued) await renderOrderItem(item.id).catch((error) => console.error(error));
  }
}

function designKey(document: unknown) {
  return createHash("sha256").update(stableJson(document)).digest("hex").slice(0, 16);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sheetStamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", year: "2-digit", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}${pick("month")}${pick("day")}`;
}

export async function createProcessSheets(orderId: string, actor: { actorType: "SYSTEM" | "STAFF"; actorId?: string }) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, processSheets: true } });
  if (!order || order.items.length === 0) return [];
  if (order.status === "WAIT_PAY" || order.status === "CANCEL") return [];
  if (order.processSheets.length > 0) return order.processSheets;

  const groups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const key = `${item.productId}\n${item.colorHex}\n${designKey(item.document)}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await insertSheets(order, groups, actor);
    } catch (error) {
      const unique = typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
      if (!unique || attempt === 2) throw error;
    }
  }
  return [];
}

async function insertSheets(order: { id: string; tenantId: string }, groups: Map<string, { id: string; productName: string; colorName: string; colorHex: string; sizeName: string; quantity: number }[]>, actor: { actorType: "SYSTEM" | "STAFF"; actorId?: string }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.processSheet.findMany({ where: { orderId: order.id } });
    if (existing.length > 0) return existing;
    const created = [];
    for (const items of groups.values()) {
      const first = items[0];
      if (!first) continue;
      const sizes = new Map<string, number>();
      for (const item of items) sizes.set(item.sizeName, (sizes.get(item.sizeName) ?? 0) + item.quantity);
      const prefix = `GY${sheetStamp(new Date())}`;
      const latest = await tx.processSheet.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
      const parsed = latest ? Number(latest.code.slice(prefix.length)) : 0;
      const sequence = Number.isFinite(parsed) ? parsed + 1 : 1;
      const sheet = await tx.processSheet.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          code: `${prefix}${String(sequence).padStart(4, "0")}`,
          productName: first.productName,
          colorName: first.colorName,
          colorHex: first.colorHex,
          sizes: [...sizes.entries()].map(([name, quantity]) => ({ name, quantity })),
          orderItemIds: items.map((item) => item.id),
        },
      });
      created.push(sheet);
    }
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        tenantId: order.tenantId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        event: "sheet",
        note: created.map((sheet) => sheet.code).join("、"),
      },
    });
    return created;
  });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  WAIT_PAY: "待支付",
  WAIT_MANUFACTURE: "待生产",
  WAIT_RECEIVE: "待收货",
  FINISH: "已完成",
  CANCEL: "已取消",
  CLOSE: "交易关闭",
};

export const EVENT_LABEL: Record<string, string> = {
  create: "提交订单",
  pay: "支付成功",
  cancel: "取消订单",
  expire: "超时关闭",
  ship: "已发货",
  receive: "确认收货",
  refund: "退款",
  sheet: "生成工艺单",
};

export type { SurfaceId };
