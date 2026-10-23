export type OrderStatus =
  | "WAIT_PAY"
  | "WAIT_MANUFACTURE"
  | "WAIT_RECEIVE"
  | "FINISH"
  | "CANCEL"
  | "CLOSE";

export type OrderEvent = "pay" | "cancel" | "expire" | "ship" | "receive" | "refund";

const transitions: Record<OrderStatus, Partial<Record<OrderEvent, OrderStatus>>> = {
  WAIT_PAY: { pay: "WAIT_MANUFACTURE", cancel: "CANCEL", expire: "CANCEL" },
  WAIT_MANUFACTURE: { ship: "WAIT_RECEIVE", refund: "CLOSE" },
  WAIT_RECEIVE: { receive: "FINISH" },
  FINISH: {},
  CANCEL: {},
  CLOSE: {},
};

export function transition(status: OrderStatus, event: OrderEvent): OrderStatus {
  const next = transitions[status][event];
  if (!next) {
    throw new Error(`订单状态 ${status} 不能执行 ${event}`);
  }
  return next;
}

export function createOrderCode(now = new Date()) {
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${year}${month}${day}${suffix}`;
}
