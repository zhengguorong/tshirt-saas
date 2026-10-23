import { describe, expect, it } from "vitest";
import { emptyDocument, orderPrice, parseDesignDocument, type DesignDocumentV1 } from "./index";

const areas = [
  { surface: "front" as const, surchargeCents: 0 },
  { surface: "back" as const, surchargeCents: 2000 },
];
const shipping = { type: "FLAT" as const, flatCents: 800, thresholdCents: null };

function withImage(document: DesignDocumentV1, surface: "front" | "back") {
  document.surfaces[surface] = {
    elements: [
      {
        id: surface,
        type: "image",
        assetId: "asset",
        x: 0.5,
        y: 0.5,
        w: 0.4,
        h: 0.4,
        rotation: 0,
        z: 1,
      },
    ],
  };
  return document;
}

describe("orderPrice", () => {
  it("charges the blank price when only the free front is used", () => {
    const document = withImage(emptyDocument("tee", "white"), "front");
    const price = orderPrice({
      lines: [{ baseCents: 7900, quantity: 1, document, areas }],
      shipping,
    });
    expect(price.totalCents).toBe(8700);
    expect(price.printCents).toBe(0);
  });

  it("adds the back surcharge for each piece", () => {
    const document = withImage(withImage(emptyDocument("tee", "white"), "front"), "back");
    const price = orderPrice({
      lines: [{ baseCents: 7900, quantity: 2, document, areas }],
      shipping,
    });
    expect(price.totalCents).toBe(20600);
  });

  it("does not charge an empty back", () => {
    const document = withImage(emptyDocument("tee", "white"), "front");
    document.surfaces.back = { elements: [] };
    const price = orderPrice({
      lines: [{ baseCents: 7900, quantity: 2, document, areas }],
      shipping,
    });
    expect(price.printCents).toBe(0);
    expect(price.totalCents).toBe(16600);
  });

  it("waives shipping over the threshold", () => {
    const document = withImage(emptyDocument("tee", "white"), "front");
    const price = orderPrice({
      lines: [{ baseCents: 7900, quantity: 1, document, areas }],
      shipping: { type: "FREE_OVER", flatCents: 800, thresholdCents: 7900 },
    });
    expect(price.shippingCents).toBe(0);
    expect(price.totalCents).toBe(7900);
  });
});

describe("parseDesignDocument", () => {
  it("rejects an element whose center leaves the print area", () => {
    const result = parseDesignDocument({
      version: 1,
      productId: "tee",
      colorId: "white",
      surfaces: {
        front: {
          elements: [
            {
              id: "a",
              type: "text",
              text: "你好",
              fontId: "sans",
              fontSize: 120,
              color: "#111111",
              x: 1.2,
              y: 0.5,
              w: 0.2,
              h: 0.2,
              rotation: 0,
              z: 1,
            },
          ],
        },
      },
    });
    expect(result.success).toBe(false);
  });
});
