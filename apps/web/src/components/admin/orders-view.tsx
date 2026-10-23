"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@tshirt/db";
import { CheckCircleOutlined, ClockCircleOutlined, InboxOutlined, SearchOutlined, ShoppingOutlined, SyncOutlined, TruckOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Input, Table, Tabs, Typography } from "antd";
import { OrderStatusBadge } from "@/components/admin/status-badge";

const highlights = ["WAIT_MANUFACTURE", "WAIT_PAY", "WAIT_RECEIVE", "FINISH"] as const;
const metrics = { WAIT_MANUFACTURE: { label: "待生产订单", hint: "及时安排制作", icon: InboxOutlined, color: "blue" }, WAIT_PAY: { label: "待支付订单", hint: "等待顾客完成支付", icon: ClockCircleOutlined, color: "amber" }, WAIT_RECEIVE: { label: "待收货订单", hint: "已发货，等待签收", icon: TruckOutlined, color: "purple" }, FINISH: { label: "已完成订单", hint: "交易已顺利完成", icon: CheckCircleOutlined, color: "green" } };
export function OrdersView({ counts, orders }: { counts: Record<(typeof highlights)[number], number>; orders: { id: string; code: string; goods: string; receiver: string; status: OrderStatus; total: string; time: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = orders.filter(order => (status === "all" || order.status === status) && `${order.code} ${order.goods} ${order.receiver}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="admin-page"><div className="admin-page-heading"><div><span className="admin-eyebrow">经营管理 / ORDERS</span><Typography.Title level={3}>订单管理</Typography.Title><Typography.Text type="secondary">从顾客下单到生产发货，每一笔订单都清楚可见。</Typography.Text></div><Button icon={<SyncOutlined />} onClick={() => router.refresh()}>刷新订单</Button></div>
    <div className="admin-metrics">{highlights.map(key => { const item = metrics[key]; const Icon = item.icon; return <Card key={key} className={`admin-metric is-${item.color}`}><div className="admin-metric-top"><span>{item.label}</span><span className="admin-metric-icon"><Icon /></span></div><strong>{counts[key]}<small>单</small></strong><span className="admin-metric-hint">{item.hint}</span></Card>; })}</div>
    <Card className="admin-table-card" styles={{ body: { padding: 0 } }}><div className="admin-table-heading"><div><strong>最近订单</strong><span>展示最近 30 笔订单，支持在当前列表中搜索与筛选</span></div><Input aria-label="搜索最近订单" prefix={<SearchOutlined />} placeholder="搜索订单号、商品或收货人" value={query} allowClear onChange={e => setQuery(e.target.value)} /></div><Tabs className="admin-list-tabs" activeKey={status} onChange={setStatus} items={[{ key: "all", label: `全部 ${orders.length}` }, ...highlights.map(key => ({ key, label: metrics[key].label.replace("订单", "") })), { key: "CANCEL", label: "已取消" }, { key: "CLOSE", label: "已关闭" }]} />
    <Table rowKey="id" dataSource={filtered} scroll={{ x: 850 }} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: total => `当前列表共 ${total} 单` }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={query || status !== "all" ? "没有符合条件的订单，试试其他关键词或状态。" : "还没有订单，分享店铺链接，开始接单。"} /> }} onRow={record => ({ onClick: () => router.push(`/admin/orders/${record.id}`), className: "admin-clickable-row" })} columns={[
      { title: "订单信息", dataIndex: "code", width: 220, render: (code: string, row) => <div className="admin-order-code"><span className="admin-order-icon"><ShoppingOutlined /></span><div><Link href={`/admin/orders/${row.id}`}>{code}</Link><small>{row.time}</small></div></div> },
      { title: "商品明细", dataIndex: "goods", ellipsis: true, width: 260 }, { title: "收货人", dataIndex: "receiver", width: 100 }, { title: "订单状态", dataIndex: "status", width: 115, render: (value: OrderStatus) => <OrderStatusBadge status={value} /> }, { title: "实付金额", dataIndex: "total", align: "right", width: 110, render: (value: string) => <span className="admin-money">{value}</span> }, { title: "操作", width: 90, align: "center", render: (_, row) => <Link href={`/admin/orders/${row.id}`} className="admin-action-link">查看详情</Link> },
    ]} /></Card></div>;
}
