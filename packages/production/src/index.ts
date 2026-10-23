import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import sharp from "sharp";
import { prisma, type Surface } from "@tshirt/db";
import { parseDesignDocument, type DesignElement, type SurfaceId } from "@tshirt/design";
import { transition } from "@tshirt/order";

const MOCKUP_WIDTH = 800;

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function storageRoot() {
  const configured = process.env.STORAGE_DIR || "data/uploads";
  return path.isAbsolute(configured) ? configured : path.resolve(repoRoot(), configured);
}

export async function writeStorage(objectKey: string, body: Buffer) {
  const file = path.join(storageRoot(), objectKey);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return file;
}

export async function readStorage(objectKey: string) {
  return readFile(path.join(storageRoot(), objectKey));
}

const virtualShirtFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "../assets/virtual-shirt.png");
let virtualShirtBase: { data: Buffer; width: number; height: number } | null = null;

export async function virtualShirtPng(hex: string) {
  const color = /^#?[0-9A-Fa-f]{6}$/.test(hex) ? hex.replace("#", "") : "F7F7F5";
  const red = Number.parseInt(color.slice(0, 2), 16);
  const green = Number.parseInt(color.slice(2, 4), 16);
  const blue = Number.parseInt(color.slice(4, 6), 16);
  if (!virtualShirtBase) {
    const { data, info } = await sharp(virtualShirtFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    virtualShirtBase = { data, width: info.width, height: info.height };
  }
  const pixels = Buffer.from(virtualShirtBase.data);
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) continue;
    pixels[index] = red;
    pixels[index + 1] = green;
    pixels[index + 2] = blue;
  }
  return sharp(pixels, { raw: { width: virtualShirtBase.width, height: virtualShirtBase.height, channels: 4 } })
    .resize(MOCKUP_WIDTH, MOCKUP_WIDTH, { fit: "fill" })
    .png()
    .toBuffer();
}

function surfaceId(surface: Surface): SurfaceId {
  return surface === "FRONT" ? "front" : "back";
}

function surfaceEnum(surface: SurfaceId): Surface {
  return surface === "front" ? "FRONT" : "BACK";
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function rasterize(body: Buffer) {
  const head = body.subarray(0, 80).toString("utf8");
  if (head.includes("<svg")) {
    return new Resvg(body, {
      fitTo: { mode: "width", value: 1000 },
      font: { loadSystemFonts: true },
    })
      .render()
      .asPng();
  }
  return body;
}

function elementSvg(element: DesignElement, width: number, height: number, images: Map<string, string>) {
  const centerX = element.x * width;
  const centerY = element.y * height;
  const boxW = element.w * width;
  const boxH = element.h * height;
  const left = centerX - boxW / 2;
  const top = centerY - boxH / 2;
  const rotate = `rotate(${element.rotation} ${centerX} ${centerY})`;
  if (element.type === "image") {
    const href = images.get(element.assetId);
    if (!href) return "";
    return `<image href="${href}" x="${left}" y="${top}" width="${boxW}" height="${boxH}" transform="${rotate}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<text x="${centerX}" y="${centerY}" fill="${element.color}" font-size="${element.fontSize}" font-family="PingFang SC, Noto Sans SC, sans-serif" text-anchor="middle" dominant-baseline="central" transform="${rotate}">${escapeXml(element.text)}</text>`;
}

export function renderSurfaceSvg(input: {
  exportWidth: number;
  exportHeight: number;
  elements: DesignElement[];
  images: Map<string, string>;
}) {
  const sorted = [...input.elements].sort((a, b) => a.z - b.z);
  const body = sorted.map((element) => elementSvg(element, input.exportWidth, input.exportHeight, input.images)).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${input.exportWidth}" height="${input.exportHeight}" viewBox="0 0 ${input.exportWidth} ${input.exportHeight}">
  <defs><clipPath id="area"><rect width="${input.exportWidth}" height="${input.exportHeight}"/></clipPath></defs>
  <g clip-path="url(#area)">${body}</g>
</svg>`;
}

async function pngFromSvg(svg: string, width: number) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
}

type SnapshotArea = {
  surface: SurfaceId;
  x: number;
  y: number;
  w: number;
  h: number;
  exportWidth: number;
  exportHeight: number;
};

type Snapshot = {
  colorHex: string;
  frontMockupKey: string;
  backMockupKey: string | null;
  areas: SnapshotArea[];
};

async function mockupPng(snapshot: Snapshot, surface: SurfaceId) {
  const key = surface === "front" ? snapshot.frontMockupKey : snapshot.backMockupKey;
  if (!key || key.startsWith("mockup/")) {
    return virtualShirtPng(snapshot.colorHex);
  }
  return sharp(await rasterize(await readStorage(key))).resize({ width: MOCKUP_WIDTH }).png().toBuffer();
}

export async function renderOrderItem(orderItemId: string) {
  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) return;
  const parsed = parseDesignDocument(item.document);
  const snapshot = item.snapshot as Snapshot;
  if (!parsed.success || !snapshot?.areas) {
    await prisma.orderItem.update({ where: { id: item.id }, data: { fileStatus: "FAILED" } });
    return;
  }

  try {
    const elements = [...(parsed.data.surfaces.front?.elements ?? []), ...(parsed.data.surfaces.back?.elements ?? [])];
    const assetIds = elements.filter((element) => element.type === "image").map((element) => element.assetId);
    const uniqueIds = [...new Set(assetIds)];
    const assets = uniqueIds.length
      ? await prisma.asset.findMany({ where: { id: { in: uniqueIds }, tenantId: item.tenantId } })
      : [];
    const images = new Map<string, string>();
    for (const asset of assets) {
      const png = await rasterize(await readStorage(asset.objectKey));
      images.set(asset.id, `data:image/png;base64,${png.toString("base64")}`);
    }

    for (const area of snapshot.areas) {
      const elements = parsed.data.surfaces[area.surface]?.elements ?? [];
      if (elements.length === 0) continue;
      const svg = renderSurfaceSvg({
        exportWidth: area.exportWidth,
        exportHeight: area.exportHeight,
        elements,
        images,
      });
      const printPng = await pngFromSvg(svg, area.exportWidth);
      const printKey = `tenants/${item.tenantId}/orders/${item.orderId}/${item.id}-${area.surface}.png`;
      await writeStorage(printKey, printPng);
      await prisma.productionFile.upsert({
        where: { orderItemId_surface_kind: { orderItemId: item.id, surface: surfaceEnum(area.surface), kind: "print" } },
        update: { objectKey: printKey, status: "READY", error: "" },
        create: {
          orderItemId: item.id,
          tenantId: item.tenantId,
          surface: surfaceEnum(area.surface),
          kind: "print",
          objectKey: printKey,
          status: "READY",
        },
      });

      const mockup = await mockupPng(snapshot, area.surface);
      const meta = await sharp(mockup).metadata();
      const mockupWidth = meta.width ?? MOCKUP_WIDTH;
      const mockupHeight = meta.height ?? MOCKUP_WIDTH;
      const placed = await sharp(printPng)
        .resize(Math.max(1, Math.round(area.w * mockupWidth)), Math.max(1, Math.round(area.h * mockupHeight)))
        .png()
        .toBuffer();
      const preview = await sharp(mockup)
        .composite([{ input: placed, left: Math.round(area.x * mockupWidth), top: Math.round(area.y * mockupHeight) }])
        .png()
        .toBuffer();
      const previewKey = `tenants/${item.tenantId}/orders/${item.orderId}/${item.id}-${area.surface}-preview.png`;
      await writeStorage(previewKey, preview);
      await prisma.productionFile.upsert({
        where: { orderItemId_surface_kind: { orderItemId: item.id, surface: surfaceEnum(area.surface), kind: "preview" } },
        update: { objectKey: previewKey, status: "READY", error: "" },
        create: {
          orderItemId: item.id,
          tenantId: item.tenantId,
          surface: surfaceEnum(area.surface),
          kind: "preview",
          objectKey: previewKey,
          status: "READY",
        },
      });
    }

    await prisma.orderItem.update({ where: { id: item.id }, data: { fileStatus: "READY" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "渲染失败";
    await prisma.orderItem.update({ where: { id: item.id }, data: { fileStatus: "FAILED" } });
    await prisma.productionFile.updateMany({
      where: { orderItemId: item.id, status: "PENDING" },
      data: { status: "FAILED", error: message },
    });
    throw error;
  }
}

export async function expireOrders() {
  const due = await prisma.order.findMany({
    where: { status: "WAIT_PAY", expiresAt: { lt: new Date() } },
    take: 50,
  });
  for (const order of due) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (!current || current.status !== "WAIT_PAY" || current.expiresAt > new Date()) return;
      const next = transition(current.status, "expire");
      await tx.order.update({ where: { id: current.id }, data: { status: next } });
      await tx.payment.updateMany({ where: { orderId: current.id, status: "PENDING" }, data: { status: "FAILED" } });
      await tx.orderEvent.create({
        data: { orderId: current.id, tenantId: current.tenantId, actorType: "SYSTEM", event: "expire", note: "超过 30 分钟未支付" },
      });
    });
  }
}

export async function enqueueRender(orderItemId: string) {
  if (!process.env.REDIS_URL) return false;
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 800,
    lazyConnect: true,
  });
  try {
    await connection.connect();
    const queue = new Queue("production", { connection });
    await queue.add("render", { orderItemId }, { attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: 200 });
    await queue.close();
    return true;
  } catch (error) {
    console.error("enqueue render failed", error);
    return false;
  } finally {
    connection.disconnect();
  }
}

export async function imageSize(buffer: Buffer) {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error("无法读取图片尺寸");
  return { width: meta.width, height: meta.height };
}

export async function scheduleExpiry() {
  if (!process.env.REDIS_URL) return;
  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue("production", { connection });
  await queue.add("expire", {}, { repeat: { every: 60_000 }, jobId: "expire-orders" });
  await queue.close();
  connection.disconnect();
}
