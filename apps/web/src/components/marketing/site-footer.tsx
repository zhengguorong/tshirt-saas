import Link from "next/link";

export function SiteFooter({ dev }: { dev: boolean }) {
  return (
    <footer className="mk-footer">
      <div className="mk-wrap mk-footer-grid">
        <div>
          <Link href="/" className="mk-brand">
            <span className="mk-mark" aria-hidden="true">印</span>
            印坊
          </Link>
          <p>服装定制商家的经营管理系统。
            连接独立店铺、在线设计、订单管理与生产交付，让定制生意更有条理。</p>
        </div>
        <div>
          <p className="mk-footer-label">看看</p>
          <Link href="/#product">产品</Link>
          <Link href="/pricing">价格</Link>
          <Link href="/demo">申请演示</Link>
          <Link href="/s/demo">示例店铺</Link>
        </div>
        <div>
          <p className="mk-footer-label">进入</p>
          <Link href="/signup">免费开店</Link>
          <Link href="/admin/login">商家后台</Link>
          <Link href="/platform/login">平台开通</Link>
        </div>
      </div>
      {dev ? (
        <div className="mk-wrap">
          <p className="mk-dev">
            开发环境验证码 000000。平台 13800000000 · 示例店主 13800000001 · 店员 13800000003。顾客用任意 11 位手机号登录。
          </p>
        </div>
      ) : null}
      <div className="mk-wrap mk-legal">
        <p>© {new Date().getFullYear()} 印坊</p>
        <p>专业和工坊方案确认后再签约，这个网站不自动扣款。</p>
      </div>
    </footer>
  );
}
