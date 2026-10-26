"use client";

import { useState } from "react";
import { Button, Card, Form, Input, InputNumber, Space, Switch, Tag, Typography } from "antd";
import { addColorAction, toggleSizeAction, updateProductAction } from "@/server/actions";

export function ProductEditor({
  product,
}: {
  product: {
    id: string;
    name: string;
    detail: string;
    priceYuan: string;
    publish: boolean;
    frontSurchargeYuan: string;
    backSurchargeYuan: string;
    summary: string;
    colors: { name: string; hex: string }[];
    sizes: { id: string; name: string; available: boolean }[];
  };
}) {
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <div className="admin-page admin-form-page">
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>{product.name}</Typography.Title>
        <Typography.Text type="secondary">{product.summary}</Typography.Text>
      </div>
      <Card title="基本信息">
        <Form
          layout="vertical"
          initialValues={{
            name: product.name,
            detail: product.detail,
            priceYuan: product.priceYuan,
            frontSurchargeYuan: product.frontSurchargeYuan,
            backSurchargeYuan: product.backSurchargeYuan,
            publish: product.publish,
          }}
          onFinish={async (values) => {
            setSaving(true);
            const data = new FormData();
            data.set("productId", product.id);
            data.set("name", values.name || "");
            data.set("detail", values.detail || "");
            data.set("priceYuan", String(values.priceYuan ?? ""));
            data.set("frontSurchargeYuan", String(values.frontSurchargeYuan ?? 0));
            data.set("backSurchargeYuan", String(values.backSurchargeYuan ?? 0));
            if (values.publish) data.set("publish", "on");
            await updateProductAction(data);
            setSaving(false);
          }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true, message: "请填写名称" }]}><Input /></Form.Item>
          <Form.Item label="售价（元）" name="priceYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="说明" name="detail"><Input.TextArea rows={3} /></Form.Item>
          <div className="admin-form-grid">
            <Form.Item label="正面加价（元）" name="frontSurchargeYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="背面加价（元）" name="backSurchargeYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item label="上架销售" name="publish" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
        </Form>
      </Card>
      <Card title="颜色">
        <Typography.Paragraph type="secondary" className="admin-color-summary">{product.colors.map((color) => `${color.name} ${color.hex}`).join("、")}</Typography.Paragraph>
        <Form
          layout="vertical"
          className="admin-color-form"
          onFinish={async (values) => {
            setAdding(true);
            const data = new FormData();
            data.set("productId", product.id);
            data.set("name", values.name || "");
            data.set("hex", values.hex || "");
            await addColorAction(data);
            setAdding(false);
          }}
        >
          <Form.Item label="颜色名" name="name"><Input placeholder="藏青" /></Form.Item>
          <Form.Item label="色值" name="hex"><Input placeholder="#112233" /></Form.Item>
          <Form.Item><Button htmlType="submit" loading={adding}>添加</Button></Form.Item>
        </Form>
      </Card>
      <Card title="尺码">
        <Typography.Paragraph type="secondary">停用后顾客不能再选这个尺码，已下的订单不受影响。</Typography.Paragraph>
        <Space wrap>
          {product.sizes.map((size) => (
            <Button
              key={size.id}
              type={size.available ? "primary" : "default"}
              onClick={() => {
                const data = new FormData();
                data.set("sizeId", size.id);
                data.set("available", size.available ? "false" : "true");
                void toggleSizeAction(data);
              }}
            >
              {size.name} <Tag style={{ marginInlineEnd: 0 }}>{size.available ? "在售" : "停用"}</Tag>
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
