export function ShopPreview() {
  return (
    <div className="mk-shop" aria-hidden="true">
      <div className="mk-shop-top">
        <span className="mk-dots"><i /><i /><i /></span>
        <span>北岛印社 · /s/beidao</span>
      </div>
      <div className="mk-shirt-stage">
        <Shirt />
        <div className="mk-seal">
          <strong>印坊</strong>
          <span>可定制</span>
        </div>
      </div>
      <div className="mk-shop-meta">
        <div>
          <p className="mk-shop-name">重磅圆领</p>
          <p className="mk-shop-sub">墨黑 · 正面印花</p>
        </div>
        <p className="mk-shop-price">¥128</p>
      </div>
      <div className="mk-swatches">
        <i style={{ background: "#1c1612" }} />
        <i style={{ background: "#f4efe6", boxShadow: "inset 0 0 0 1px rgba(28,22,18,.2)" }} />
        <i style={{ background: "#1d5c57" }} />
        <i style={{ background: "#c5361f" }} />
        <span>S M L XL</span>
      </div>
      <div className="mk-shop-btn">开始设计</div>
    </div>
  );
}

export function EditorPreview() {
  return (
    <div className="mk-editor" aria-hidden="true">
      <div className="mk-editor-tabs">
        <span className="is-on">正面</span>
        <span>背面</span>
      </div>
      <div className="mk-editor-body">
        <div className="mk-editor-canvas">
          <Shirt small />
          <span className="mk-placed">北岛</span>
        </div>
        <div className="mk-library">
          <p>印花素材</p>
          <div>
            <span>印</span>
            <span>岛</span>
            <span>+</span>
          </div>
          <p className="mk-library-note">这一面印刷 +¥15</p>
        </div>
      </div>
    </div>
  );
}

export function SheetPreview() {
  return (
    <div className="mk-ticket" aria-hidden="true">
      <p className="mk-ticket-kicker">工艺单</p>
      <p className="mk-ticket-code">YF-20261023-014</p>
      <p className="mk-ticket-title">重磅圆领 · 墨黑</p>
      <ul>
        <li><span>S</span><b>12</b></li>
        <li><span>M</span><b>20</b></li>
        <li><span>L</span><b>8</b></li>
        <li><span>XL</span><b>3</b></li>
      </ul>
      <p className="mk-ticket-foot">正面生产图已生成，可打印给车间</p>
    </div>
  );
}

function Shirt({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "mk-shirt is-small" : "mk-shirt"} viewBox="0 0 200 210" fill="none">
      <path d="M48 34 L74 18 L100 38 L126 18 L152 34 L184 62 L158 78 L158 192 L42 192 L42 78 L16 62 Z" fill="#f7f1e6" stroke="#1c1612" strokeWidth="3" />
      <path d="M74 18 C82 36 118 36 126 18" stroke="#1c1612" strokeWidth="3" />
    </svg>
  );
}
