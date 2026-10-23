"use client";

import { Card, Table, Typography } from "antd";

export type DemoRow = {
  id: string;
  when: string;
  name: string;
  phone: string;
  company: string;
  role: string;
  volume: string;
  plan: string;
  note: string;
};

export function DemosView({ rows }: { rows: DemoRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>演示申请</Typography.Title>
        <Typography.Text type="secondary">官网提交的演示申请。按时间从新到旧。</Typography.Text>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          locale={{ emptyText: "还没有演示申请" }}
          columns={[
            { title: "时间", dataIndex: "when", width: 180 },
            { title: "姓名", dataIndex: "name", width: 100 },
            { title: "手机", dataIndex: "phone", width: 130 },
            { title: "店铺或公司", dataIndex: "company" },
            { title: "身份", dataIndex: "role", width: 120 },
            { title: "单量", dataIndex: "volume", width: 160 },
            { title: "方案", dataIndex: "plan", width: 90 },
            {
              title: "备注",
              dataIndex: "note",
              ellipsis: true,
              render: (note: string) => note || "—",
            },
          ]}
        />
      </Card>
    </div>
  );
}
