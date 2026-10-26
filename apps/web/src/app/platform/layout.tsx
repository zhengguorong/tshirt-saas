import { AntdRoot } from "@/components/admin/antd-root";
import "../admin/admin.css";

export default function PlatformRootLayout({ children }: { children: React.ReactNode }) {
  return <AntdRoot>{children}</AntdRoot>;
}
