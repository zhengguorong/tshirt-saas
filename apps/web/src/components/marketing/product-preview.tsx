import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ClipboardList, ImageIcon, Layers, Minus, MousePointer2, Palette, Plus, Redo2, Search, Settings2, Shirt, ShoppingBag, SlidersHorizontal, Type, Undo2, Upload, X } from "lucide-react";

/** Illustrative software screens; the live product is available in the demo store. */
export function ProductShirt({ dark = false, printed = false }: { dark?: boolean; printed?: boolean }) {
  return (
    <svg viewBox="0 0 200 230" fill="none" className="sp-shirt" aria-hidden="true">
      <path d="M63 18L80 11Q100 21 120 11L137 18 183 55 160 94 141 83 146 208Q100 220 54 208L59 83 40 94 17 55Z" fill={dark ? "#292d36" : "#f2f3f5"} stroke={dark ? "#161c27" : "#d4d7dd"} strokeWidth="1.2" />
      <path d="M80 12Q83 36 100 37Q117 36 120 12L115 14Q111 29 100 29Q89 29 85 14Z" fill={dark ? "#151b25" : "#d5d8df"} />
      <path d="M60 80L65 39M140 80L135 39M56 202Q100 213 144 202M22 56L42 89M178 56L158 89" stroke={dark ? "#454b55" : "#d0d3d9"} />
      <path d="M65 90Q74 125 65 173M135 101Q125 158 138 196M76 185Q84 203 113 206" stroke={dark ? "#151b25" : "#c4c9d1"} strokeOpacity=".35" strokeWidth="3" />
      {printed && <g fill={dark ? "#dce4ff" : "#2443e8"} fontFamily="Arial, sans-serif" fontWeight="900" fontSize="23" letterSpacing="-1"><text x="73" y="104">Good</text><text x="73" y="125">Ideas</text><path d="M73 135Q86 129 99 135T126 135" stroke={dark ? "#dce4ff" : "#2443e8"} strokeWidth="3" /></g>}
    </svg>
  );
}

export function OrderScreen() {
  const menu = [{ icon: Shirt, label: "商品管理" }, { icon: Palette, label: "印花素材" }, { icon: ShoppingBag, label: "订单管理", active: true }, { icon: ClipboardList, label: "生产工艺单" }, { icon: Settings2, label: "店铺设置" }];
  const rows = [
    { id: "YF20261023001", name: "纯棉圆领 T 恤", spec: "白色 / L", qty: 50, state: "待生产", color: "amber" },
    { id: "YF20261023002", name: "重磅落肩 T 恤", spec: "墨黑 / XL", qty: 30, state: "待生产", color: "amber", dark: true },
    { id: "YF20261022003", name: "经典基础 T 恤", spec: "白色 / M", qty: 20, state: "待收货", color: "blue" },
    { id: "YF20261022004", name: "长袖纯棉 T 恤", spec: "墨黑 / L", qty: 40, state: "已完成", color: "green", dark: true },
  ];
  return (
    <div className="sp-window sp-orders" aria-hidden="true">
      <div className="sp-window-top"><strong>印坊<span>商家工作台</span></strong><div><Minus /><span className="sp-window-square" /><X /></div></div>
      <div className="sp-order-body"><aside className="sp-sidebar">{menu.map(({ icon: Icon, label, active }) => <div key={label} className={active ? "is-active" : undefined}><Icon /><span>{label}</span></div>)}<div className="sp-sidebar-bottom"><span className="sp-avatar">印</span><span>示例店铺<small>店主账号</small></span><ChevronDown /></div></aside>
        <div className="sp-order-content"><div className="sp-order-heading"><h3>订单管理</h3><span><Search /> 搜索订单号、商品或客户</span></div><p className="sp-order-subtitle">从顾客下单，到车间生产，每一单清楚可见。</p><div className="sp-order-tabs"><span className="is-active">全部订单 <b>4</b></span><span>待付款</span><span>待生产 <b>2</b></span><span>待收货 <b>1</b></span><SlidersHorizontal /></div>
          <table className="sp-order-table"><thead><tr><th><i /></th><th>订单号</th><th>商品信息</th><th>件数</th><th>订单状态</th><th>操作</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><i /></td><td>{row.id}</td><td><div className="sp-product-cell"><span><ProductShirt dark={row.dark} /></span><div>{row.name}<small>{row.spec}</small></div></div></td><td>{row.qty}</td><td><span className={`sp-status is-${row.color}`}>{row.state}</span></td><td><span className="sp-table-link">查看</span></td></tr>)}</tbody></table>
          <div className="sp-pagination"><span>共 4 条订单</span><span>每页 10 条 <ChevronDown /><b>1</b><ArrowRight /></span></div>
        </div>
      </div>
    </div>
  );
}

export function DesignScreen() {
  return (
    <div className="sp-window sp-design" aria-hidden="true"><div className="sp-mini-top"><strong><ArrowLeft />在线设计器</strong><div><Undo2 /><Redo2 /><span className="sp-save">保存设计</span></div></div><div className="sp-design-body"><aside>{[{ icon: Shirt, label: "商品" }, { icon: Type, label: "文字" }, { icon: ImageIcon, label: "素材" }, { icon: Upload, label: "上传" }].map(({ icon: Icon, label }) => <div key={label}><Icon /><span>{label}</span></div>)}</aside><div className="sp-artboard"><span className="sp-front-back"><b>正面</b><span>背面</span></span><ProductShirt printed /><span className="sp-selection"><i /><i /><i /><i /></span><span className="sp-artboard-zoom"><Minus />100%<Plus /></span></div><div className="sp-properties"><strong>图层 <Layers /></strong><span className="sp-layer"><Type /> Good Ideas <Check /></span><p>尺寸与位置</p><div className="sp-coordinates"><span>X <b>120</b></span><span>Y <b>80</b></span><span>W <b>320</b></span><span>H <b>260</b></span></div><p>印花区域</p><span className="sp-region"><MousePointer2 /> 正面印区</span></div></div></div>
  );
}

export function ProductionScreen() {
  return (
    <div className="sp-window sp-production" aria-hidden="true"><div className="sp-mini-top"><strong>生产工艺单</strong><ArrowDownToLine /></div><div className="sp-generated"><CheckCircle2 /><div><strong>生产图已生成</strong><span>按底衫与颜色合并尺码，一单看清。</span></div></div><div className="sp-sheet-body"><div className="sp-sheet-shirt"><ProductShirt printed /></div><div><table><tbody><tr><th>尺码</th><td>S</td><td>M</td><td>L</td><td>合计</td></tr><tr><th>数量</th><td>10</td><td>20</td><td>20</td><td>50</td></tr></tbody></table><p><span>商品名称</span> 纯棉圆领 T 恤</p><p><span>印花位置</span> 正面印区</p></div></div></div>
  );
}

export function ProductScene() {
  return <div className="sp-scene" role="img" aria-label="印坊产品界面示意：订单管理工作台、在线设计器和生产工艺单协同运转"><div className="sp-scene-orders"><OrderScreen /></div><div className="sp-scene-design"><DesignScreen /></div><div className="sp-scene-production"><ProductionScreen /></div><span className="sp-scene-caption">产品界面示意 · 示例数据</span></div>;
}

export function StoreScreen() {
  return <div className="sp-window sp-store" aria-hidden="true"><div className="sp-mini-top"><strong>北岛印社</strong><span>首页　商品　<ShoppingBag /></span></div><div className="sp-store-banner"><div><span>YOUR IDEAS, YOUR WAY</span><strong>穿上你的想法。</strong><small>选择底衫，开始你的创作。</small></div><ProductShirt printed /></div><div className="sp-store-products">{[false, true, false].map((dark, i) => <div key={i}><ProductShirt dark={dark} /><span>{["经典圆领", "重磅落肩", "基础短袖"][i]}<b>¥{[89, 129, 99][i]}</b></span></div>)}</div></div>;
}
