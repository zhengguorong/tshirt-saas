"use client";

import type { OrderStatus } from "@tshirt/db";
import { Tag } from "antd";

const label: Record<OrderStatus, string> = {
  WAIT_PAY: "待支付",
  WAIT_MANUFACTURE: "待生产",
  WAIT_RECEIVE: "待收货",
  FINISH: "已完成",
  CANCEL: "已取消",
  CLOSE: "交易关闭",
};

const color: Record<OrderStatus, string> = {
  WAIT_PAY: "warning",
  WAIT_MANUFACTURE: "processing",
  WAIT_RECEIVE: "blue",
  FINISH: "success",
  CANCEL: "default",
  CLOSE: "error",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Tag color={color[status]}>{label[status]}</Tag>;
}
