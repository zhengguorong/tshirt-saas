"use client";

import { useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Empty, Row, Typography, Upload } from "antd";

export function MaterialsView({
  owner,
  slug,
  materials,
}: {
  owner: boolean;
  slug: string;
  materials: { id: string; name: string; image: string }[];
}) {
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>印花素材</Typography.Title>
          <Typography.Text type="secondary">顾客在设计器里可以直接用这些图案。</Typography.Text>
        </div>
        {owner ? (
          <Upload
            accept="image/png,image/jpeg"
            showUploadList={false}
            beforeUpload={async (file) => {
              setUploading(true);
              const body = new FormData();
              body.set("file", file);
              body.set("slug", slug);
              body.set("source", "material");
              body.set("name", file.name);
              const response = await fetch("/api/uploads", { method: "POST", body });
              const data = (await response.json()) as { error?: string };
              if (!response.ok) {
                message.error(data.error || "上传失败");
                setUploading(false);
                return false;
              }
              window.location.reload();
              return false;
            }}
          >
            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>上传素材</Button>
          </Upload>
        ) : null}
      </div>
      {materials.length === 0 ? (
        <Card><Empty description="还没有素材。上传 PNG 或 JPG，建议透明底。" /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {materials.map((material) => (
            <Col key={material.id} xs={12} sm={8} md={6} xl={4}>
              <Card cover={<img src={material.image} alt="" style={{ aspectRatio: "1", objectFit: "contain", background: "#fafafa" }} />} styles={{ body: { padding: 12 } }}>
                <Typography.Text ellipsis>{material.name}</Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
