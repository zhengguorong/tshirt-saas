"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DownloadOutlined } from "@ant-design/icons";
import type { OrderStatus } from "@tshirt/db";
import { Alert, Button, Card, Col, Descriptions, Form, Input, Row, Space, Tag, Timeline, Typography } from "antd";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { generateSheetsAction, refundAction, retryRenderAction, shipAction } from "@/server/actions";

export function OrderDetailView({
  order,
}: {
  order: {
    id: string;
    code: string;
    status: OrderStatus;
    createdAt: string;
    total: string;
    base: string;
    print: string;
    shipping: string;
    receiverName: string;
    receiverPhone: string;
    address: string;
    shipment: string | null;
    items: { id: string; title: string; spec: string; fileStatus: string; fileColor: string; files: { id: string; href: string; label: string }[] }[];
    events: { id: string; label: string; time: string }[];
    sheets: { id: string; code: string }[];
    canSheet: boolean;
  };
}) {
  const router = useRouter();
  const [shipping, setShipping] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [makingSheet, setMakingSheet] = useState(false);
  const canShip = order.status === "WAIT_MANUFACTURE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Space align="center">
        <Typography.Title level={4} style={{ margin: 0 }}>{order.code}</Typography.Title>
        <OrderStatusBadge status={order.status} />
        <Typography.Text type="secondary">{order.createdAt} · 合计 {order.total}</Typography.Text>
      </Space>
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            {order.items.map((item) => (
              <Card key={item.id} title={item.title} extra={item.spec}>
                <Space orientation="vertical">
                  <span>生产文件 <Tag color={item.fileColor}>{item.fileStatus}</Tag></span>
                  <Space wrap>
                    {item.files.map((file) => (
                      <Button key={file.id} icon={<DownloadOutlined />} href={file.href} target="_blank">{file.label}</Button>
                    ))}
                  </Space>
                </Space>
              </Card>
            ))}
            <Card title="进度">
              <Timeline items={order.events.map((event) => ({ key: event.id, content: <span>{event.label} <Typography.Text type="secondary">{event.time}</Typography.Text></span> }))} />
            </Card>
          </Space>
        </Col>
        <Col xs={24} lg={8}>
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Card title="收货信息">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="收货人">{order.receiverName} {order.receiverPhone}</Descriptions.Item>
                <Descriptions.Item label="地址">{order.address}</Descriptions.Item>
                <Descriptions.Item label="底衫">{order.base}</Descriptions.Item>
                <Descriptions.Item label="印刷">{order.print}</Descriptions.Item>
                <Descriptions.Item label="运费">{order.shipping}</Descriptions.Item>
              </Descriptions>
            </Card>
            {order.shipment ? <Alert type="info" title={order.shipment} /> : null}
            {canShip ? (
              <Card title="发货">
                <Form
                  layout="vertical"
                  onFinish={async (values) => {
                    setShipping(true);
                    const data = new FormData();
                    data.set("orderId", order.id);
                    data.set("carrier", values.carrier || "");
                    data.set("trackingNo", values.trackingNo || "");
                    await shipAction(data);
                    setShipping(false);
                  }}
                >
                  <Form.Item label="快递公司" name="carrier" rules={[{ required: true, message: "请填写快递公司" }]}><Input placeholder="顺丰" /></Form.Item>
                  <Form.Item label="运单号" name="trackingNo" rules={[{ required: true, message: "请填写运单号" }]}><Input placeholder="SF1234567890" /></Form.Item>
                  <Button type="primary" htmlType="submit" loading={shipping}>确认发货</Button>
                </Form>
              </Card>
            ) : null}
            {canShip ? (
              <Card title="退款">
                <Form
                  layout="vertical"
                  onFinish={async (values) => {
                    setRefunding(true);
                    const data = new FormData();
                    data.set("orderId", order.id);
                    data.set("note", values.note || "");
                    await refundAction(data);
                    setRefunding(false);
                  }}
                >
                  <Form.Item label="原因" name="note"><Input placeholder="顾客要求取消" /></Form.Item>
                  <Button danger htmlType="submit" loading={refunding}>退款并关闭</Button>
                </Form>
              </Card>
            ) : null}
            <Card title="工艺单">
              <Space orientation="vertical">
                {order.sheets.map((sheet) => (
                  <Link key={sheet.id} href={`/admin/sheets/${sheet.id}`}>{sheet.code}</Link>
                ))}
                {order.sheets.length === 0 ? <Typography.Text type="secondary">{order.canSheet ? "支付后按颜色合并尺码，生成一张工艺单。" : "订单支付后才会生成工艺单。"}</Typography.Text> : null}
                {order.canSheet && order.sheets.length === 0 ? (
                  <Button
                    type="primary"
                    loading={makingSheet}
                    onClick={() => {
                      setMakingSheet(true);
                      const data = new FormData();
                      data.set("orderId", order.id);
                      void generateSheetsAction(data).then(() => router.refresh()).finally(() => setMakingSheet(false));
                    }}
                  >
                    生成工艺单
                  </Button>
                ) : null}
              </Space>
            </Card>
            <Button
              onClick={() => {
                const data = new FormData();
                data.set("orderId", order.id);
                void retryRenderAction(data).then(() => router.refresh());
              }}
            >
              重新生成生产图
            </Button>
            <Button type="link" onClick={() => router.push("/admin")} style={{ paddingInline: 0 }}>返回订单列表</Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
