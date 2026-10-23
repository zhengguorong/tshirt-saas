"use client";

import { startTransition, useActionState } from "react";
import { Alert, Button, Card, Form, Input, InputNumber, Switch, Typography } from "antd";
import { createProductAction } from "@/server/actions";

export function ProductCreateForm() {
  const [state, submit, pending] = useActionState(createProductAction, null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>新建底衫</Typography.Title>
        <Typography.Text type="secondary">创建后可以继续调整颜色、尺码和印刷加价。</Typography.Text>
      </div>
      <Card title="基本信息">
        <Form
          layout="vertical"
          initialValues={{ priceYuan: 79, sizes: "S,M,L,XL", colorName: "白色", colorHex: "#F7F7F5", enableBack: true, frontSurchargeYuan: 0, backSurchargeYuan: 20, publish: true }}
          onFinish={(values) => {
            const data = new FormData();
            data.set("name", values.name || "");
            data.set("priceYuan", String(values.priceYuan ?? ""));
            data.set("detail", values.detail || "");
            data.set("sizes", values.sizes || "");
            data.set("colorName", values.colorName || "");
            data.set("colorHex", values.colorHex || "");
            data.set("color2Name", values.color2Name || "");
            data.set("color2Hex", values.color2Hex || "");
            data.set("frontSurchargeYuan", String(values.frontSurchargeYuan ?? 0));
            data.set("backSurchargeYuan", String(values.backSurchargeYuan ?? 0));
            if (values.enableBack) data.set("enableBack", "on");
            if (values.publish) data.set("publish", "on");
            startTransition(() => submit(data));
          }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true, message: "请填写名称" }]}>
            <Input placeholder="例如 白坯短袖" />
          </Form.Item>
          <Form.Item label="售价（元）" name="priceYuan" rules={[{ required: true, message: "请填写售价" }]}>
            <InputNumber min={1} step={0.01} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="说明" name="detail">
            <Input.TextArea rows={3} placeholder="面料、克重、适合的印花方式" />
          </Form.Item>
          <Form.Item label="尺码" name="sizes" extra="用逗号分隔，例如 S,M,L,XL。">
            <Input />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item label="颜色名" name="colorName"><Input /></Form.Item>
            <Form.Item label="色值" name="colorHex"><Input /></Form.Item>
            <Form.Item label="第二颜色" name="color2Name"><Input placeholder="可空" /></Form.Item>
            <Form.Item label="第二色值" name="color2Hex"><Input placeholder="#1A1A1A" /></Form.Item>
            <Form.Item label="正面加价（元）" name="frontSurchargeYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="背面加价（元）" name="backSurchargeYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item label="开启背面印刷" name="enableBack" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="立即上架" name="publish" valuePropName="checked"><Switch /></Form.Item>
          {state?.error ? <Alert type="error" title={state.error} style={{ marginBottom: 16 }} /> : null}
          <Button type="primary" htmlType="submit" loading={pending}>创建底衫</Button>
        </Form>
      </Card>
    </div>
  );
}
