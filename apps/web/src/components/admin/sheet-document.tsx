"use client";

import { Button, Card, Col, Descriptions, Image, Row, Space, Typography } from "antd";
import { PrintButton } from "@/components/admin/print-button";

export function SheetDocument({
  sheet,
}: {
  sheet: {
    code: string;
    orderId: string;
    orderCode: string;
    orderTime: string;
    productName: string;
    colorName: string;
    colorHex: string;
    sizes: string;
    receiverName: string;
    receiverPhone: string;
    address: string;
    sides: { id: string; title: string; preview: string | null; print: string | null }[];
  };
}) {
  return (
    <div className="admin-page admin-sheet-document">
      <style>{`
        @media print {
          .no-print, .ant-layout-sider, .ant-layout-header { display: none !important; }
          .ant-layout, .ant-layout-content { background: #fff !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
      <div className="no-print admin-sheet-heading">
        <Typography.Title level={4} style={{ margin: 0 }}>{sheet.code}</Typography.Title>
        <Space>
          <PrintButton />
          <Button href={`/admin/orders/${sheet.orderId}`}>返回订单</Button>
        </Space>
      </div>
      <Descriptions
        bordered
        size="middle"
        column={{ xs: 1, sm: 2, lg: 3 }}
        styles={{ label: { width: 96, whiteSpace: "nowrap" } }}
        items={[
          { key: "code", label: "工艺单号", children: sheet.code },
          { key: "order", label: "订单号", children: sheet.orderCode },
          { key: "time", label: "下单时间", children: sheet.orderTime },
          { key: "product", label: "底衫", span: "filled", children: sheet.productName },
          {
            key: "color",
            label: "颜色",
            children: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: sheet.colorHex, border: "1px solid rgba(0,0,0,0.12)" }} />
                {sheet.colorName}
              </span>
            ),
          },
          { key: "sizes", label: "尺码", span: "filled", children: sheet.sizes },
          { key: "receiver", label: "收货人", children: `${sheet.receiverName} ${sheet.receiverPhone}` },
          { key: "address", label: "地址", span: "filled", children: sheet.address },
        ]}
      />
      {sheet.sides.map((side) => (
        <Card key={side.id} title={side.title}>
          {side.preview || side.print ? (
            <Row gutter={[16, 20]}>
              <Col xs={24} sm={12} className="admin-sheet-picture-column">
                <Picture label="效果图" src={side.preview} empty="效果图生成中" />
              </Col>
              <Col xs={24} sm={12} className="admin-sheet-picture-column">
                <Picture label="印刷图" src={side.print} empty="印刷图生成中" />
              </Col>
            </Row>
          ) : (
            <Typography.Text type="secondary">这一面没有印花</Typography.Text>
          )}
        </Card>
      ))}
    </div>
  );
}

function Picture({ label, src, empty }: { label: string; src: string | null; empty: string }) {
  return (
    <div>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div className="admin-sheet-picture">
        {src ? (
          <Image src={src} alt={label} styles={{ root: { position: "absolute", inset: 0, width: "100%", height: "100%" }, image: { width: "100%", height: "100%", objectFit: "contain" } }} />
        ) : (
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <Typography.Text type="secondary">{empty}</Typography.Text>
          </span>
        )}
      </div>
    </div>
  );
}
