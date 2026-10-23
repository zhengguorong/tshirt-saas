"use client";

import { StyleProvider } from "@ant-design/cssinjs";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

export function AntdRoot({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <StyleProvider layer>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: "#1677ff",
              borderRadius: 6,
              fontFamily: "inherit",
            },
            components: {
              Layout: {
                siderBg: "#001529",
                headerBg: "#ffffff",
                bodyBg: "#f5f5f5",
              },
            },
          }}
        >
          <App>{children}</App>
        </ConfigProvider>
      </StyleProvider>
    </AntdRegistry>
  );
}
