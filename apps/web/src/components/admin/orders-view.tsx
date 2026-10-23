"use client";

import { useRouter } from "next/navigation";
import type { OrderStatus } from "@tshirt/db";
import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import { OrderStatusBadge } from "@/components/admin/status-badge";

const highlights = ["WAIT_MANUFACTURE", "WAIT_PAY", "WAIT_RECEIVE", "FINISH"] as const;
const highlightLabel: Record<(typeof highlights)[number], string> = {
  WAIT_MANUFACTURE: "待生产",
  WAIT_PAY: "待支付",
  WAIT_RECEIVE: "待收货",
  FINISH: "已完成",
};

export function OrdersView({
  counts,
  orders,
}: {
  counts: Record<(typeof highlights)[number], number>;
  orders: { id: string; code: string; goods: string; receiver: string; status: OrderStatus; total: string; time: string }[];
}) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>订单</Typography.Title>
        <Typography.Text type="secondary">支付后生成生产图和工艺单，发货后顾客确认收货。</Typography.Text>
      </div>
      <Row gutter={16}>
        {highlights.map((status) => (
          <Col key={status} xs={12} xl={6}>
            <Card>
              <Statistic title={highlightLabel[status]} value={counts[status]} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={orders}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 单` }}
          locale={{ emptyText: "还没有订单。顾客支付后会出现在这里。" }}
          onRow={(record) => ({ onClick: () => router.push(`/admin/orders/${record.id}`), style: { cursor: "pointer" } })}
          columns={[
            { title: "订单号", dataIndex: "code", render: (code: string) => <Typography.Text strong>{code}</Typography.Text> },
            { title: "商品", dataIndex: "goods", ellipsis: true },
            { title: "收货人", dataIndex: "receiver" },
            { title: "状态", dataIndex: "status", render: (status: OrderStatus) => <OrderStatusBadge status={status} /> },
            { title: "金额", dataIndex: "total", align: "right" },
            { title: "下单时间", dataIndex: "time" },
          ]}
        />
      </Card>
    </div>
  );
}
