"use client";

import { startTransition, useActionState } from "react";
import { Alert, Button, Card, Form, Input, InputNumber, Select, Typography } from "antd";
import { saveSettingsAction } from "@/server/actions";

export function ShopSettingsForm({
  shopUrl,
  name,
  description,
  contact,
  customDomain,
  shippingType,
  flatYuan,
  thresholdYuan,
}: {
  shopUrl: string;
  name: string;
  description: string;
  contact: string;
  customDomain: string;
  shippingType: string;
  flatYuan: string;
  thresholdYuan: string;
}) {
  const [state, submit, pending] = useActionState(saveSettingsAction, null);
  return (
    <div className="admin-page admin-form-page">
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>店铺设置</Typography.Title>
        <Typography.Text type="secondary">顾客通过分配的地址进入这间店。独立域名可以之后再绑。</Typography.Text>
      </div>
      <Card title="店铺资料">
        <Form
      layout="vertical"
      initialValues={{ name, description, contact, customDomain, shippingType, flatYuan: Number(flatYuan), thresholdYuan: Number(thresholdYuan) }}
      onFinish={(values) => {
        const data = new FormData();
        data.set("name", values.name || "");
        data.set("description", values.description || "");
        data.set("contact", values.contact || "");
        data.set("customDomain", values.customDomain || "");
        data.set("shippingType", values.shippingType || "FLAT");
        data.set("flatYuan", String(values.flatYuan ?? 0));
        data.set("thresholdYuan", String(values.thresholdYuan ?? 0));
        startTransition(() => submit(data));
      }}
    >
      <Form.Item label="店铺地址" extra="这是系统分配的访问地址，创建后不能修改。">
        <Input readOnly value={shopUrl} />
      </Form.Item>
      <Form.Item label="名称" name="name" rules={[{ required: true, message: "请填写名称" }]}><Input /></Form.Item>
      <Form.Item label="简介" name="description"><Input.TextArea rows={3} /></Form.Item>
      <Form.Item label="联系方式" name="contact"><Input /></Form.Item>
      <Form.Item label="独立域名" name="customDomain" extra="以后把这个域名解析到本站，顾客就能用它打开店铺。留空表示暂不绑定。">
        <Input placeholder="shop.example.com" />
      </Form.Item>
      <Form.Item label="运费方式" name="shippingType" extra="满额包邮时，订单金额达到门槛则免运费。">
        <Select options={[{ value: "FLAT", label: "固定运费" }, { value: "FREE_OVER", label: "满额包邮" }]} />
      </Form.Item>
      <Form.Item label="运费（元）" name="flatYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
      <Form.Item label="包邮门槛（元）" name="thresholdYuan"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item>
      {state && "error" in state && state.error ? <Alert type="error" title={state.error} style={{ marginBottom: 16 }} /> : null}
      {state && "saved" in state && state.saved ? <Alert type="success" title="已保存" style={{ marginBottom: 16 }} /> : null}
      <Button type="primary" htmlType="submit" loading={pending}>保存</Button>
    </Form>
      </Card>
    </div>
  );
}
