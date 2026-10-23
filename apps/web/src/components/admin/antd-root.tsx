"use client";

import { StyleProvider } from "@ant-design/cssinjs";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

export function AntdRoot({ children, merchant = false }: { children: React.ReactNode; merchant?: boolean }) {
  return (
    <AntdRegistry>
      <StyleProvider layer>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: merchant ? "#3155e7" : "#1677ff",
              ...(merchant ? { colorText: "#26334b", colorTextHeading: "#14213b", colorTextSecondary: "#8a95a8", colorBorder: "#dfe5ef", colorBorderSecondary: "#edf0f6", colorBgLayout: "#f6f8fc", controlHeight: 36, fontSize: 13 } : {}),
              borderRadius: merchant ? 8 : 6,
              fontFamily: "inherit",
            },
            components: {
              ...(merchant ? { Card: { headerFontSize: 14, headerHeight: 58 }, Table: { headerBg: "#f8faff", headerColor: "#8591a7", headerSplitColor: "transparent", cellPaddingBlock: 18, rowHoverBg: "#f8faff" }, Menu: { itemHeight: 44, itemSelectedBg: "#edf2ff", itemSelectedColor: "#3155e7", itemColor: "#66748f", itemBorderRadius: 7 }, Button: { primaryShadow: "0 3px 7px rgba(49,85,231,.12)" } } : {}),
              Layout: {
                siderBg: "#001529",
                headerBg: "#ffffff",
                bodyBg: merchant ? "#f6f8fc" : "#f5f5f5",
              },
            },
          }}
        >
          <App className={merchant ? "merchant-root" : undefined}>{children}</App>
        </ConfigProvider>
      </StyleProvider>
    </AntdRegistry>
  );
}
