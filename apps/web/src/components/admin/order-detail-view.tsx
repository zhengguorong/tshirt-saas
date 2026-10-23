"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, DownloadOutlined, FileTextOutlined, InboxOutlined, RedoOutlined, SkinOutlined, TruckOutlined } from "@ant-design/icons";
import type { OrderStatus } from "@tshirt/db";
import { App, Button, Card, Collapse, Empty, Form, Image, Input, Steps, Tag, Timeline, Typography } from "antd";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { generateSheetsAction, refundAction, retryRenderAction, shipAction } from "@/server/actions";

type DetailOrder = {
  id: string; code: string; status: OrderStatus; createdAt: string;
  total: string; base: string; print: string; shipping: string;
  receiverName: string; receiverPhone: string; address: string; shipment: string | null;
  items: { id: string; title: string; spec: string; fileStatus: string; fileColor: string; files: { id: string; href: string; label: string }[] }[];
  events: { id: string; label: string; time: string }[];
  sheets: { id: string; code: string }[]; canSheet: boolean;
};
const statusHint: Record<OrderStatus, string> = {
  WAIT_PAY: "等待顾客付款，支付后将生成生产资料。",
  WAIT_MANUFACTURE: "请核对生产资料，完成制作后填写物流信息发货。",
  WAIT_RECEIVE: "商品已发货，等待顾客确认收货。",
  FINISH: "订单已完成，可以查阅生产资料与操作记录。",
  CANCEL: "订单已取消，请以订单记录为准。",
  CLOSE: "交易已关闭，请以订单记录为准。",
};
export function OrderDetailView({ order }: { order: DetailOrder }) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [shipForm] = Form.useForm();
  const canShip = order.status === "WAIT_MANUFACTURE";
  const terminal = order.status === "CANCEL" || order.status === "CLOSE";
  const amountLabel = order.status === "WAIT_PAY" ? "待付金额" : terminal ? "订单金额" : "订单实付";
  const step = { WAIT_PAY: 0, WAIT_MANUFACTURE: 1, WAIT_RECEIVE: 2, FINISH: 3, CANCEL: 0, CLOSE: 0 }[order.status];

  async function perform(key: string, action: (data: FormData) => Promise<void>, fields: Record<string, string>, success: string) {
    setBusy(key);
    try {
      const data = new FormData();
      data.set("orderId", order.id);
      for (const [name, value] of Object.entries(fields)) data.set(name, value);
      await action(data);
      message.success(success);
      router.refresh();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败，请稍后重试。");
      return false;
    } finally { setBusy(null); }
  }

  return (
    <div className="admin-page order-detail">
      <Link href="/admin" className="detail-back"><ArrowLeftOutlined />返回订单列表</Link>
      <div className="detail-page-heading">
        <div><div className="detail-title-line"><Typography.Title level={3}>订单详情</Typography.Title><OrderStatusBadge status={order.status} /></div><div className="detail-order-meta"><Typography.Text copyable={{ text: order.code }}>{order.code}</Typography.Text><span>下单时间 {order.createdAt}</span></div></div>
        <div className="detail-total"><span>{amountLabel}</span><strong>{order.total}</strong></div>
      </div>
      <Card className="detail-progress"><div className="detail-status-hint"><CheckCircleOutlined /><span>{statusHint[order.status]}</span></div>{!terminal && <Steps current={step} status={order.status === "FINISH" ? "finish" : "process"} size="small" items={[{ title: "等待付款" }, { title: "制作与发货" }, { title: "等待收货" }, { title: "订单完成" }]} />}</Card>
      <div className="detail-grid">
        <div className="detail-main-column">
          <Card title={<span className="detail-card-title"><SkinOutlined />商品与生产资料</span>} extra={<span className="detail-card-note">{order.items.length} 项商品</span>} className="detail-products" styles={{ body: { padding: 0 } }}>
            {order.items.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品明细" />}
            {order.items.map((item, index) => (
              <section className="detail-product" key={item.id}>
                <div className="detail-product-heading"><span className="detail-product-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><span>{item.spec}</span></div><Tag variant="filled" color={item.fileColor}>生产文件 · {item.fileStatus}</Tag></div>
                {item.files.length ? <Image.PreviewGroup><div className="detail-files">{item.files.map(file => <div className="detail-file" key={file.id}><div className="detail-file-preview"><Image src={file.href} alt={file.label} height={136} /></div><div className="detail-file-label"><span>{file.label}</span><a href={file.href} target="_blank" rel="noreferrer" aria-label={`打开${file.label}`}><DownloadOutlined />原图</a></div></div>)}</div></Image.PreviewGroup> : <div className="detail-file-empty"><InboxOutlined /><span>{terminal ? "订单已结束，暂无可用生产文件。" : !order.canSheet ? "订单支付后生成生产文件" : item.fileColor === "error" ? "生产文件生成失败，可在更多操作中重新生成。" : item.fileColor === "success" ? "暂无可用生产文件，可在更多操作中重新生成。" : "生产文件正在生成，请稍后刷新查看。"}</span></div>}
              </section>
            ))}
          </Card>
          <Card className="detail-sheets" title={<span className="detail-card-title"><FileTextOutlined />生产工艺单</span>} extra={<span className="detail-card-note">按底衫与颜色合并</span>}>
            <div className="detail-sheet-list">{order.sheets.map(sheet => <Link key={sheet.id} href={`/admin/sheets/${sheet.id}`} className="detail-sheet-link"><span className="detail-sheet-icon"><FileTextOutlined /></span><div><strong>{sheet.code}</strong><span>查看尺码数量、印花要求与打印资料</span></div><ArrowRightOutlined /></Link>)}</div>
            {!order.sheets.length && <div className="detail-sheet-empty"><div><strong>暂无工艺单</strong><p>{terminal ? "订单已结束，暂无关联工艺单。" : order.canSheet ? "按同款同色汇总尺码数量，供车间安排生产。" : "订单支付后，系统将按底衫与颜色生成工艺单。"}</p></div>{order.canSheet && <Button icon={<FileTextOutlined />} disabled={!!busy} loading={busy === "sheet"} onClick={() => void perform("sheet", generateSheetsAction, {}, "工艺单已生成")}>生成工艺单</Button>}</div>}
          </Card>
          <Card title="订单记录" className="detail-timeline">{order.events.length ? <Timeline items={order.events.map((event, index) => ({ key: event.id, color: index === order.events.length - 1 ? "blue" : "gray", content: <div className="detail-event"><span>{event.label}</span><time>{event.time}</time></div> }))} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无操作记录" />}</Card>
        </div>
        <aside className="detail-side-column">
          {canShip && <Card title={<span className="detail-card-title"><TruckOutlined />发货处理</span>} className="detail-shipping"><p className="detail-card-description">核对商品与收货信息后，填写物流信息完成发货。</p><Form form={shipForm} layout="vertical" requiredMark={false} onFinish={async values => { const ok = await perform("ship", shipAction, { carrier: values.carrier.trim(), trackingNo: values.trackingNo.trim() }, "发货信息已保存"); if (ok) shipForm.resetFields(); }}><Form.Item label="快递公司" name="carrier" rules={[{ required: true, whitespace: true, message: "请填写快递公司" }]}><Input placeholder="例如：顺丰速运" /></Form.Item><Form.Item label="运单号" name="trackingNo" rules={[{ required: true, whitespace: true, message: "请填写运单号" }]}><Input placeholder="填写快递运单号" /></Form.Item><Button type="primary" htmlType="submit" block icon={<TruckOutlined />} disabled={!!busy} loading={busy === "ship"}>确认发货</Button></Form></Card>}
          <Card title="收货信息" className="detail-receiver"><dl className="detail-info"><div><dt>收货人</dt><dd>{order.receiverName}</dd></div><div><dt>联系电话</dt><dd><Typography.Text copyable={{ text: order.receiverPhone }}>{order.receiverPhone}</Typography.Text></dd></div><div className="is-stacked"><dt>收货地址</dt><dd>{order.address}</dd></div></dl>{order.shipment && <div className="detail-shipment"><TruckOutlined /><div><strong>物流信息</strong><Typography.Text copyable={{ text: order.shipment }}>{order.shipment}</Typography.Text></div></div>}</Card>
          <Card title="费用明细" className="detail-amounts"><dl className="detail-info detail-costs"><div><dt>底衫金额</dt><dd>{order.base}</dd></div><div><dt>印花费用</dt><dd>{order.print}</dd></div><div><dt>运费</dt><dd>{order.shipping}</dd></div><div className="detail-cost-total"><dt>{amountLabel}</dt><dd>{order.total}</dd></div></dl></Card>
          {order.canSheet && <Collapse className="detail-more" items={[{ key: "more", label: "更多操作", children: <div className="detail-secondary-actions"><div><strong>重新生成生产图</strong><p>生产文件缺失或生成失败时使用。</p><Button icon={<RedoOutlined />} disabled={!!busy} loading={busy === "render"} onClick={() => void perform("render", retryRenderAction, {}, "已提交重新生成请求")}>重新生成生产图</Button></div>{canShip && <div className="detail-refund"><strong>退款并关闭订单</strong><p>请先与顾客确认，再填写退款原因。</p><Form layout="vertical" requiredMark={false} onFinish={values => { modal.confirm({ title: "确认退款并关闭订单？", content: <><p>订单：{order.code}</p><p>此操作会关闭订单，原因：{values.note}</p></>, okText: "确认退款并关闭", cancelText: "暂不操作", okButtonProps: { danger: true }, onOk: async () => { const ok = await perform("refund", refundAction, { note: values.note.trim() }, "退款关闭操作已完成"); if (!ok) throw new Error("操作失败"); } }); }}><Form.Item label="退款原因" name="note" rules={[{ required: true, whitespace: true, message: "请填写退款原因" }]}><Input.TextArea rows={2} maxLength={300} placeholder="填写与顾客确认的原因" /></Form.Item><Button danger htmlType="submit" disabled={!!busy} loading={busy === "refund"}>退款并关闭</Button></Form></div>}</div> }]} />}
        </aside>
      </div>
    </div>
  );
}
