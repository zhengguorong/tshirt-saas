"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, MousePointer2, RefreshCw, Sparkles } from "lucide-react";

export function Garment({ dark = false, design = 0 }: { dark?: boolean; design?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 460 490" fill="none" className="yf-garment" role="img" aria-label={`${dark ? "墨黑" : "奶油白"}印花 T 恤设计示意`}>
      <defs>
        <linearGradient id={`${id}-fabric`} x1="90" y1="120" x2="375" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor={dark ? "#36343c" : "#fffef7"} /><stop offset=".4" stopColor={dark ? "#24232a" : "#f3f0e7"} /><stop offset=".72" stopColor={dark ? "#302e36" : "#fffdf7"} /><stop offset="1" stopColor={dark ? "#1e1d25" : "#dcd9d1"} />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="14" floodColor="#292035" floodOpacity=".18" /></filter>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <path d="M151 57L188 42Q230 61 272 42L309 57 409 135 365 211 321 187 332 433Q230 453 128 433L139 187 95 211 51 135Z" fill={`url(#${id}-fabric)`} stroke={dark ? "#222129" : "#d9d6ce"} />
        <path d="M188 43Q190 96 230 99Q270 96 272 43L261 47Q257 80 230 81Q203 80 199 47Z" fill={dark ? "#19181f" : "#dfdcd4"} />
        <path d="M199 49Q202 83 230 85Q258 83 261 49M138 180L150 110M322 180L310 110M129 423Q230 442 331 423M58 137L98 203M402 137L362 203" stroke={dark ? "#55515c" : "#d3d0c7"} strokeOpacity=".6" strokeWidth="2" />
        <path d="M145 218Q157 263 145 337M312 242Q302 326 319 395M172 397Q181 418 218 426" stroke={dark ? "#0b0a10" : "#b8b4aa"} strokeOpacity=".12" strokeWidth="5" />
        {design === 0 ? <g>
          <text x="230" y="167" textAnchor="middle" fill={dark ? "#d5c5f3" : "#66508e"} fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" letterSpacing="4">A LITTLE DIFFERENT</text>
          <path d="M230 208C199 159 172 193 198 222C145 208 147 253 191 253C149 282 181 311 211 278C202 330 247 331 249 283C276 323 312 291 274 261C327 267 325 222 278 229C310 192 273 166 252 211C252 159 210 159 230 208Z" fill="#b6a0dc" />
          <circle cx="235" cy="246" r="24" fill="#e4f18c" /><path d="M224 248Q235 260 246 248" stroke="#52416f" strokeWidth="2.5" strokeLinecap="round" /><circle cx="227" cy="240" r="2" fill="#52416f" /><circle cx="243" cy="240" r="2" fill="#52416f" />
          <text x="230" y="355" textAnchor="middle" fill={dark ? "#e0d9ed" : "#52416f"} fontSize="29" fontFamily="Georgia, serif" fontStyle="italic">Grow your own way.</text>
          <text x="230" y="376" textAnchor="middle" fill={dark ? "#d5c5f3" : "#66508e"} fontSize="8" letterSpacing="3">YINFANG ORIGINAL / 001</text>
        </g> : <g fill={dark ? "#e3f090" : "#66508e"} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="53" letterSpacing="-3"><text x="230" y="207">MAKE</text><text x="230" y="260">SOME</text><text x="230" y="313">THING.</text><text x="230" y="353" fontSize="9" letterSpacing="3">GOOD IDEAS DESERVE TO BE WORN.</text></g>}
      </g>
    </svg>
  );
}

export function CreativePreview() {
  const [dark, setDark] = useState(false);
  const [design, setDesign] = useState(0);
  return (
    <div className="yf-preview">
      <div className="yf-preview-top"><span><i /> 你的创意，正在成形</span><span>DESIGN STUDIO ↗</span></div>
      <div className="yf-preview-canvas">
        <span className="yf-canvas-word" aria-hidden="true">CREATE.</span>
        <div className="yf-main-garment"><Garment dark={dark} design={design} /></div>
        <div className="yf-sticker"><Sparkles size={22} /><span>好点子<br />穿出来</span></div>
        <div className="yf-design-label"><MousePointer2 size={15} fill="currentColor" /><span>你的设计</span></div>
        <div className="yf-order-note"><span className="yf-check"><Check size={16} /></span><div><strong>创意准备就绪</strong><span>从一张图案，到一件作品</span></div></div>
      </div>
      <div className="yf-preview-tools">
        <div><span className="yf-tool-label">试试你的风格</span><div className="yf-preview-buttons"><button type="button" onClick={() => setDark(!dark)}><span className={dark ? "yf-color is-dark" : "yf-color"} />换个底色</button><button type="button" onClick={() => setDesign((design + 1) % 2)}><RefreshCw size={14} />换个灵感</button></div></div>
        <Link href="/s/demo" className="yf-preview-next" aria-label="进入示例店铺开始设计"><ArrowRight size={22} /></Link>
      </div>
      <span className="yf-preview-caption">交互示意 · 在示例店铺体验完整定制流程 <ArrowDown size={12} /></span>
    </div>
  );
}
