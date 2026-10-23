"use client";

import { Button } from "antd";

export function PrintButton() {
  return <Button type="primary" onClick={() => window.print()}>打印工艺单</Button>;
}
