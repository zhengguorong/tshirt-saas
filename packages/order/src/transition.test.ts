import { describe, expect, it } from "vitest";
import { transition } from "./index";

describe("transition", () => {
  it("pays and cancels a waiting order", () => {
    expect(transition("WAIT_PAY", "pay")).toBe("WAIT_MANUFACTURE");
    expect(transition("WAIT_PAY", "cancel")).toBe("CANCEL");
    expect(transition("WAIT_PAY", "expire")).toBe("CANCEL");
  });

  it("ships or refunds only before delivery", () => {
    expect(transition("WAIT_MANUFACTURE", "ship")).toBe("WAIT_RECEIVE");
    expect(transition("WAIT_MANUFACTURE", "refund")).toBe("CLOSE");
    expect(() => transition("WAIT_RECEIVE", "refund")).toThrow();
  });

  it("does not expire an order that is already in production", () => {
    expect(() => transition("WAIT_MANUFACTURE", "expire")).toThrow();
  });
});
