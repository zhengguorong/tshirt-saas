"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

const FRAME = { w: 300, h: 340 };

function drawnRect(naturalW: number, naturalH: number) {
  const imageRatio = naturalW / naturalH;
  const frameRatio = FRAME.w / FRAME.h;
  const drawW = imageRatio > frameRatio ? FRAME.w : FRAME.h * imageRatio;
  const drawH = imageRatio > frameRatio ? FRAME.w / imageRatio : FRAME.h;
  return { drawW, drawH, drawX: (FRAME.w - drawW) / 2, drawY: (FRAME.h - drawH) / 2 };
}

export function CropSheet({ url, busy, onCancel, onApply }: { url: string; busy: boolean; onCancel: () => void; onApply: (region: { x: number; y: number; w: number; h: number }) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const drag = useRef<{ mode: "move" | "nw" | "ne" | "sw" | "se"; x: number; y: number; crop: { x: number; y: number; w: number; h: number } } | null>(null);

  useEffect(() => {
    const element = new Image();
    element.onload = () => {
      setImage(element);
      const drawn = drawnRect(element.naturalWidth, element.naturalHeight);
      const inset = 0.12;
      setCrop({
        x: drawn.drawX + drawn.drawW * inset,
        y: drawn.drawY + drawn.drawH * inset,
        w: drawn.drawW * (1 - inset * 2),
        h: drawn.drawH * (1 - inset * 2),
      });
    };
    element.src = url;
  }, [url]);

  const drawn = image ? drawnRect(image.naturalWidth, image.naturalHeight) : null;

  function pointerDown(mode: "move" | "nw" | "ne" | "sw" | "se", event: ReactPointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    drag.current = { mode, x: event.clientX, y: event.clientY, crop };
  }

  function pointerMove(event: ReactPointerEvent) {
    const current = drag.current;
    if (!current || !drawn) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    const min = 36;
    let next = { ...current.crop };
    if (current.mode === "move") {
      next.x = Math.min(drawn.drawX + drawn.drawW - next.w, Math.max(drawn.drawX, current.crop.x + dx));
      next.y = Math.min(drawn.drawY + drawn.drawH - next.h, Math.max(drawn.drawY, current.crop.y + dy));
    } else {
      if (current.mode.includes("e")) next.w = Math.max(min, current.crop.w + dx);
      if (current.mode.includes("s")) next.h = Math.max(min, current.crop.h + dy);
      if (current.mode.includes("w")) {
        next.w = Math.max(min, current.crop.w - dx);
        next.x = current.crop.x + current.crop.w - next.w;
      }
      if (current.mode.includes("n")) {
        next.h = Math.max(min, current.crop.h - dy);
        next.y = current.crop.y + current.crop.h - next.h;
      }
      next.x = Math.max(drawn.drawX, next.x);
      next.y = Math.max(drawn.drawY, next.y);
      next.w = Math.min(next.w, drawn.drawX + drawn.drawW - next.x);
      next.h = Math.min(next.h, drawn.drawY + drawn.drawH - next.y);
    }
    setCrop(next);
  }

  function apply() {
    if (!image || !drawn) return;
    onApply({
      x: ((crop.x - drawn.drawX) / drawn.drawW) * image.naturalWidth,
      y: ((crop.y - drawn.drawY) / drawn.drawH) * image.naturalHeight,
      w: (crop.w / drawn.drawW) * image.naturalWidth,
      h: (crop.h / drawn.drawH) * image.naturalHeight,
    });
  }

  return (
    <Sheet title="裁剪" busy={busy} onCancel={onCancel} onApply={apply}>
      <div
        className="relative mx-auto bg-neutral-900"
        style={{ width: FRAME.w, height: FRAME.h }}
        onPointerMove={pointerMove}
        onPointerUp={() => { drag.current = null; }}
        onPointerLeave={() => { drag.current = null; }}
      >
        {drawn ? <img src={url} alt="" draggable={false} className="pointer-events-none absolute" style={{ left: drawn.drawX, top: drawn.drawY, width: drawn.drawW, height: drawn.drawH }} /> : null}
        <div className="absolute border-2 border-white" style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }} onPointerDown={(event) => pointerDown("move", event)}>
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <button
              key={corner}
              type="button"
              aria-label="调整裁剪框"
              className={`absolute size-3.5 bg-white ${corner.includes("n") ? "-top-1.5" : "-bottom-1.5"} ${corner.includes("w") ? "-left-1.5" : "-right-1.5"}`}
              onPointerDown={(event) => pointerDown(corner, event)}
            />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function EraserSheet({ url, busy, onCancel, onApply }: { url: string; busy: boolean; onCancel: () => void; onApply: (canvas: HTMLCanvasElement) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [brush, setBrush] = useState(22);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(FRAME.w / image.naturalWidth, FRAME.h / image.naturalHeight);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = url;
  }, [url]);

  function point(event: ReactPointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  }

  function paint(event: ReactPointerEvent) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const at = point(event);
    if (!canvas || !context || !at) return;
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brush * (canvas.width / canvas.getBoundingClientRect().width);
    context.lineTo(at.x, at.y);
    context.stroke();
    context.beginPath();
    context.moveTo(at.x, at.y);
  }

  return (
    <Sheet title="橡皮擦" busy={busy} onCancel={onCancel} onApply={() => { const canvas = canvasRef.current; if (canvas) onApply(canvas); }}>
      <div className="flex flex-col items-center gap-3">
        <canvas
          ref={canvasRef}
          className="max-h-[340px] max-w-full touch-none bg-[linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%),linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
          onPointerDown={(event) => {
            drawing.current = true;
            const context = canvasRef.current?.getContext("2d");
            const at = point(event);
            if (!context || !at) return;
            context.beginPath();
            context.moveTo(at.x, at.y);
            paint(event);
          }}
          onPointerMove={paint}
          onPointerUp={() => { drawing.current = false; }}
          onPointerLeave={() => { drawing.current = false; }}
        />
        <label className="flex w-full items-center gap-3 text-xs text-neutral-500">
          笔刷
          <input className="w-full accent-neutral-900" type="range" min={10} max={56} value={brush} onChange={(event) => setBrush(Number(event.target.value))} />
        </label>
      </div>
    </Sheet>
  );
}

function Sheet({ title, busy, onCancel, onApply, children }: { title: string; busy: boolean; onCancel: () => void; onApply: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/50">
      <div className="mt-auto flex flex-col gap-3 rounded-t-2xl bg-white px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <button type="button" className="text-sm text-neutral-500" onClick={onCancel}>取消</button>
          <p className="text-sm font-medium">{title}</p>
          <button type="button" className="text-sm font-medium" disabled={busy} onClick={onApply}>{busy ? "处理中" : "完成"}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const FONT_COLORS = [
  "#111111", "#7F7F7F", "#CCCCCC", "#FFFFFF", "#F4D7E8", "#E23B70", "#F08A80", "#E24B4B", "#9E1B2E", "#F15A2A",
  "#F5A623", "#F2C94C", "#2BB8A0", "#5C8A1A", "#5E7D62", "#7EAEB8", "#8FB4C4", "#4AA3E0", "#B9D8F2", "#8E93C9",
  "#6E63D6", "#3E46C9", "#7A5AF5", "#C026D3",
];
