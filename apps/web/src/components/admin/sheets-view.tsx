"use client";

import Link from "next/link";
import { Table, Tag, Typography } from "antd";

export function SheetsView({
  sheets,
}: {
  sheets: { id: string; code: string; orderId: string; orderCode: string; productName: string; colorName: string; colorHex: string; sizes: string; image: "ready" | "pending" | "failed"; time: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>工艺单</Typography.Title>
        <Typography.Text type="secondary">支付后按同一底衫、同一颜色合并尺码。正背面印刷图随生产图一起生成。</Typography.Text>
      </div>
      <Table
        rowKey="id"
        dataSource={sheets}
        pagination={false}
        locale={{ emptyText: "还没有工艺单。订单支付后会自动生成。" }}
        columns={[
          { title: "工艺单号", dataIndex: "code", render: (code: string, row) => <Link href={`/admin/sheets/${row.id}`}>{code}</Link> },
          { title: "订单", dataIndex: "orderCode", render: (code: string, row) => <Link href={`/admin/orders/${row.orderId}`}>{code}</Link> },
          { title: "底衫", dataIndex: "productName", ellipsis: true },
          {
            title: "颜色",
            dataIndex: "colorName",
            render: (name: string, row) => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: row.colorHex, border: "1px solid rgba(0,0,0,0.12)" }} />
                {name}
              </span>
            ),
          },
          { title: "尺码", dataIndex: "sizes" },
          {
            title: "生产图",
            dataIndex: "image",
            render: (image: "ready" | "pending" | "failed") => (
              <Tag color={image === "ready" ? "success" : image === "failed" ? "error" : "default"}>{image === "ready" ? "已生成" : image === "failed" ? "生成失败" : "生成中"}</Tag>
            ),
          },
          { title: "时间", dataIndex: "time" },
        ]}
      />
    </div>
  );
}
