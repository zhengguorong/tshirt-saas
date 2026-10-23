"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Space, Table, Tag, Typography } from "antd";

export function ProductsView({
  owner,
  slug,
  products,
}: {
  owner: boolean;
  slug: string;
  products: { id: string; name: string; image: string | null; colors: string; sizes: string; status: "ON" | "OFF"; price: string }[];
}) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>底衫</Typography.Title>
          <Typography.Text type="secondary">颜色、尺码和正反面印刷加价。</Typography.Text>
        </div>
        {owner ? <Button type="primary" onClick={() => router.push("/admin/products/new")}>新建底衫</Button> : null}
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={products}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 件` }}
          locale={{ emptyText: "还没有底衫。先创建一件，顾客才能开始设计。" }}
          onRow={(record) => ({
            onClick: () => router.push(owner ? `/admin/products/${record.id}` : `/s/${slug}/products/${record.id}`),
            style: { cursor: "pointer" },
          })}
          columns={[
            {
              title: "底衫",
              dataIndex: "name",
              render: (name: string, record) => (
                <Space>
                  {record.image ? <img src={record.image} alt="" width={40} height={40} style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #f0f0f0" }} /> : null}
                  <Typography.Text strong>{name}</Typography.Text>
                </Space>
              ),
            },
            { title: "颜色", dataIndex: "colors", ellipsis: true },
            { title: "尺码", dataIndex: "sizes", ellipsis: true },
            { title: "状态", dataIndex: "status", render: (status: "ON" | "OFF") => <Tag color={status === "ON" ? "success" : "default"}>{status === "ON" ? "在售" : "下架"}</Tag> },
            { title: "售价", dataIndex: "price", align: "right" },
          ]}
        />
      </Card>
    </div>
  );
}
