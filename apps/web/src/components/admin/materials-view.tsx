"use client";

import { useState } from "react";
import { SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Empty, Input, Row, Typography, Upload } from "antd";

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
  const [query, setQuery] = useState("");
  const visible = materials.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">商品与素材 / MATERIALS</span>
          <Typography.Title level={3}>印花素材</Typography.Title>
          <Typography.Text type="secondary">整理常用印花图案，让顾客在设计器中直接选用。</Typography.Text>
        </div>
        {owner ? (
          <Upload
            accept="image/png,image/jpeg"
            showUploadList={false}
            beforeUpload={async (file) => {
              setUploading(true);
              try {
                const body = new FormData();
                body.set("file", file);
                body.set("slug", slug);
                body.set("source", "material");
                body.set("name", file.name);
                const response = await fetch("/api/uploads", { method: "POST", body });
                const data = (await response.json()) as { error?: string };
                if (!response.ok) { message.error(data.error || "上传失败"); return false; }
                window.location.reload();
              } catch { message.error("上传失败，请检查网络后重试。"); }
              finally { setUploading(false); }
              return false;
            }}
          >
            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>上传素材</Button>
          </Upload>
        ) : null}
      </div>
      <div className="admin-material-toolbar"><Input aria-label="搜索素材" prefix={<SearchOutlined />} placeholder="搜索素材名称" value={query} allowClear onChange={e => setQuery(e.target.value)} /><span>共 {materials.length} 个素材 · PNG / JPG</span></div>
      {visible.length === 0 ? (
        <Card><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={query ? "没有找到匹配的素材。" : "还没有素材。上传 PNG 或 JPG，建议使用透明背景图案。"} /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {visible.map((material) => (
            <Col key={material.id} xs={12} sm={8} md={6} xl={4}>
              <Card className="admin-material-card" cover={<img src={material.image} alt="" style={{ aspectRatio: "1", objectFit: "contain", background: "#f7f9fd" }} />} styles={{ body: { padding: 12 } }}>
                <Typography.Text ellipsis={{ tooltip: material.name }}>{material.name}</Typography.Text>
                <div className="admin-material-caption">印花素材</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
