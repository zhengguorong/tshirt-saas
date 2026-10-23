import { z } from "zod";

export const SURFACES = ["front", "back"] as const;
export type SurfaceId = (typeof SURFACES)[number];

export const FONTS = [
  {
    id: "sans",
    name: "默认黑体",
    family: "PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif",
  },
] as const;

const elementBase = {
  id: z.string().min(1).max(80),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().positive().max(4),
  h: z.number().positive().max(4),
  rotation: z.number().min(-360).max(360),
  z: z.number().int().min(0).max(100),
};

export const imageElementSchema = z.object({
  ...elementBase,
  type: z.literal("image"),
  assetId: z.string().min(1),
});

export const textElementSchema = z.object({
  ...elementBase,
  type: z.literal("text"),
  text: z.string().min(1).max(40),
  fontId: z.literal("sans"),
  fontSize: z.number().positive().max(2000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const elementSchema = z.discriminatedUnion("type", [
  imageElementSchema,
  textElementSchema,
]);

export const surfaceSchema = z.object({
  elements: z.array(elementSchema).max(20),
});

export const designDocumentSchema = z.object({
  version: z.literal(1),
  productId: z.string().min(1),
  colorId: z.string().min(1),
  surfaces: z.object({
    front: surfaceSchema.optional(),
    back: surfaceSchema.optional(),
  }),
});

export type ImageElement = z.infer<typeof imageElementSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type DesignElement = z.infer<typeof elementSchema>;
export type DesignDocumentV1 = z.infer<typeof designDocumentSchema>;

export type ShippingRule = {
  type: "FLAT" | "FREE_OVER";
  flatCents: number;
  thresholdCents: number | null;
};

export function parseDesignDocument(input: unknown) {
  return designDocumentSchema.safeParse(input);
}

export function emptyDocument(productId: string, colorId: string): DesignDocumentV1 {
  return { version: 1, productId, colorId, surfaces: { front: { elements: [] } } };
}

export function usedSurfaces(document: DesignDocumentV1): SurfaceId[] {
  return SURFACES.filter((surface) => (document.surfaces[surface]?.elements.length ?? 0) > 0);
}

export function linePrice(input: {
  baseCents: number;
  quantity: number;
  document: DesignDocumentV1;
  areas: Array<{ surface: SurfaceId; surchargeCents: number }>;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) {
    throw new Error("数量需要在 1 到 20 之间");
  }
  const used = usedSurfaces(input.document);
  const printPerUnit = used.reduce((sum, surface) => {
    const area = input.areas.find((item) => item.surface === surface);
    return sum + (area?.surchargeCents ?? 0);
  }, 0);
  const baseCents = input.baseCents * input.quantity;
  const printCents = printPerUnit * input.quantity;
  return {
    baseCents,
    printCents,
    goodsCents: baseCents + printCents,
    usedSurfaces: used,
  };
}

export function shippingFee(goodsCents: number, shipping: ShippingRule) {
  if (
    shipping.type === "FREE_OVER" &&
    shipping.thresholdCents !== null &&
    goodsCents >= shipping.thresholdCents
  ) {
    return 0;
  }
  return shipping.flatCents;
}

export function orderPrice(input: {
  lines: Array<{
    baseCents: number;
    quantity: number;
    document: DesignDocumentV1;
    areas: Array<{ surface: SurfaceId; surchargeCents: number }>;
  }>;
  shipping: ShippingRule;
}) {
  const lines = input.lines.map((line) => linePrice(line));
  const baseCents = lines.reduce((sum, line) => sum + line.baseCents, 0);
  const printCents = lines.reduce((sum, line) => sum + line.printCents, 0);
  const goodsCents = baseCents + printCents;
  const shippingCents = shippingFee(goodsCents, input.shipping);
  return {
    baseCents,
    printCents,
    goodsCents,
    shippingCents,
    totalCents: goodsCents + shippingCents,
  };
}

export function yuanToCents(yuan: number) {
  if (!Number.isFinite(yuan) || yuan < 0) throw new Error("金额无效");
  return Math.round(yuan * 100);
}

export function formatYuan(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}

function tone(hex: string, amount: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (bits: number) => {
    const current = (value >> bits) & 255;
    const next = amount < 0 ? current * (1 + amount) : current + (255 - current) * amount;
    return Math.max(0, Math.min(255, Math.round(next))).toString(16).padStart(2, "0");
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

export function shirtSvg(hex: string, side: "front" | "back") {
  const color = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#F7F7F5";
  const cloth = tone(color, 0.06);
  const shade = tone(color, -0.16);
  const deep = tone(color, -0.28);
  const id = `${side}${color.slice(1)}`;
  const neck = side === "front" ? "A58 36 0 0 1 150 118" : "A58 16 0 0 1 150 118";
  const collar = `M250 118 ${neck}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">
  <defs>
    <linearGradient id="body${id}" x1="0.32" y1="0" x2="0.68" y2="1">
      <stop offset="0" stop-color="${cloth}"/>
      <stop offset="0.4" stop-color="${color}"/>
      <stop offset="1" stop-color="${shade}"/>
    </linearGradient>
    <filter id="shadow${id}" x="-16%" y="-6%" width="132%" height="118%">
      <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#1a1814" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="400" height="520" fill="#f3efe6"/>
  <g filter="url(#shadow${id})">
    <path fill="url(#body${id})" d="M112 440
      C140 462 260 462 288 440
      C308 320 310 230 300 180
      C328 198 350 200 358 188
      C370 172 366 156 348 142
      C320 126 280 118 250 118
      ${neck}
      C120 118 80 126 52 142
      C34 156 30 172 42 188
      C50 200 72 198 100 180
      C90 230 92 320 112 440
      Z"/>
    <path fill="${shade}" d="M124 432 H276 C274 450 250 458 226 458 H174 C150 458 126 450 124 432 Z"/>
    <path fill="none" stroke="${deep}" stroke-width="9" stroke-linecap="round" d="${collar}"/>
    <path fill="none" stroke="${cloth}" stroke-width="2.5" stroke-linecap="round" d="${collar}"/>
    <path fill="none" stroke="${shade}" stroke-width="1.5" opacity="0.5" d="M200 164 L200 428"/>
  </g>
</svg>`;
}
