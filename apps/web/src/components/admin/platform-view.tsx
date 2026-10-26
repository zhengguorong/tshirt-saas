"use client";

import { useState } from "react";
import { startTransition, useActionState } from "react";
import { Alert, Button, Card, Col, Form, Input, Row, Table, Tag, Typography } from "antd";
import { createTenantAction, setTenantStateAction } from "@/server/actions";

export function TenantCreateForm() {
  const [state, submit, pending] = useActionState(createTenantAction, null);
  return (
    <Form
      layout="vertical"
      onFinish={(values) => {
        const data = new FormData();
        data.set("name", values.name || "");
        data.set("slug", values.slug || "");
        data.set("owner", values.owner || "");
        data.set("phone", values.phone || "");
        startTransition(() => submit(data));
      }}
    >
      <Form.Item label="店铺名" name="name" rules={[{ required: true, message: "请填写店铺名" }]}><Input /></Form.Item>
      <Form.Item label="店铺标识" name="slug" extra="顾客访问 /s/标识。3 到 32 位小写字母、数字或横线。" rules={[{ required: true, message: "请填写标识" }]}>
        <Input placeholder="studio" />
      </Form.Item>
      <Form.Item label="店主姓名" name="owner" rules={[{ required: true, message: "请填写店主姓名" }]}><Input /></Form.Item>
      <Form.Item label="店主手机号" name="phone" rules={[{ required: true, pattern: /^1\d{10}$/, message: "请输入 11 位手机号" }]}>
        <Input inputMode="numeric" />
      </Form.Item>
      {state?.error ? <Alert type="error" title={state.error} style={{ marginBottom: 16 }} /> : null}
      <Button type="primary" htmlType="submit" loading={pending}>开通商家</Button>
    </Form>
  );
}

export function PlatformView({
  tenants,
}: {
  tenants: { id: string; name: string; slug: string; domain: string | null; products: number; orders: number; active: boolean }[];
}) {
  const [pendingId, setPendingId] = useState("");
  return (
    <div className="admin-page">
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>商家</Typography.Title>
        <Typography.Text type="secondary">商家可以自行注册。这里仍可代为开通、停用。</Typography.Text>
      </div>
      <Row gutter={[16, 20]}>
        <Col xs={24} xl={8}>
          <Card title="开通商家">
            <TenantCreateForm />
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Card className="admin-table-card" styles={{ body: { padding: 0 } }}>
            <div className="admin-table-scroll-note">左右滑动查看完整表格</div>
            <Table
              scroll={{ x: 680 }}
              rowKey="id"
              dataSource={tenants}
              pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 家` }}
              locale={{ emptyText: "还没有商家" }}
              columns={[
                {
                  title: "店铺",
                  dataIndex: "name",
                  render: (_name: string, tenant) => (
                    <div>
                      <div>{tenant.name}</div>
                      <Typography.Text type="secondary">/s/{tenant.slug}</Typography.Text>
                      {tenant.domain ? <div><Typography.Text type="secondary">{tenant.domain}</Typography.Text></div> : null}
                    </div>
                  ),
                },
                { title: "底衫", dataIndex: "products", width: 80 },
                { title: "订单", dataIndex: "orders", width: 80 },
                {
                  title: "状态",
                  dataIndex: "active",
                  width: 90,
                  render: (active: boolean) => <Tag color={active ? "success" : "default"}>{active ? "启用" : "停用"}</Tag>,
                },
                {
                  title: "操作",
                  width: 100,
                  render: (_value, tenant) => (
                    <Button
                      loading={pendingId === tenant.id}
                      onClick={() => {
                        setPendingId(tenant.id);
                        const data = new FormData();
                        data.set("tenantId", tenant.id);
                        data.set("status", tenant.active ? "SUSPENDED" : "ACTIVE");
                        void setTenantStateAction(data).finally(() => setPendingId(""));
                      }}
                    >
                      {tenant.active ? "停用" : "启用"}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
