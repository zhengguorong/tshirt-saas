"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PencilIcon, RotateCwIcon, XIcon } from "lucide-react";
import type { DesignDocumentV1, DesignElement, SurfaceId } from "@tshirt/design";
import type { LibraryItem, PrintArea } from "./editor-types";

type Patch = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rotation?: number;
  fontSize?: number;
};

type Mode = "drag" | "rotate" | "pinch" | "left" | "right" | "top" | "bottom";

type Gesture = {
  id: string;
  mode: Mode;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
  originRotation: number;
  originFont: number;
  centerX: number;
  centerY: number;
  startDist: number;
  startAngle: number;
  moved: boolean;
};

const SHIRT_ASPECT = 1;

function ShirtImage({ src }: { src: string }) {
  const currentRef = useRef(src);
  const [current, setCurrent] = useState(src);
  const [previous, setPrevious] = useState<string | null>(null);
  useEffect(() => {
    if (src === currentRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      currentRef.current = src;
      setCurrent(src);
      setPrevious(null);
      return;
    }
    setPrevious(currentRef.current);
    currentRef.current = src;
    setCurrent(src);
    const timer = window.setTimeout(() => setPrevious(null), 180);
    return () => window.clearTimeout(timer);
  }, [src]);
  return (
    <div className="relative h-full w-full">
      {previous ? <img src={previous} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" /> : null}
      <img src={current} alt="" draggable={false} className={previous ? "img-in pointer-events-none h-full w-full" : "pointer-events-none h-full w-full"} />
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snapAngle(degrees: number) {
  const turns = [0, 90, 180, 270, -90, -180];
  const wrapped = ((degrees + 180) % 360 + 360) % 360 - 180;
  for (const turn of turns) {
    if (Math.abs(wrapped - turn) <= 7.5 || Math.abs(wrapped - turn + 360) <= 7.5) return turn;
  }
  return wrapped;
}

export function EditorStage({
  design,
  surface,
  area,
  mockupUrl,
  library,
  selectedId,
  enlarged,
  onSelect,
  onPatch,
  onFitText,
  onBegin,
  onEnd,
  onEdit,
  onDelete,
  bornId,
}: {
  design: DesignDocumentV1;
  surface: SurfaceId;
  area: PrintArea;
  mockupUrl: string;
  library: LibraryItem[];
  selectedId: string | null;
  enlarged: boolean;
  onSelect: (id: string | null) => void;
  onPatch: (id: string, patch: Patch) => void;
  onFitText: (id: string, w: number, h: number) => void;
  onBegin: () => void;
  onEnd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  bornId: string | null;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const gestureRef = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastTap = useRef({ at: 0, id: "" });
  const [viewport, setViewport] = useState({ w: 390, h: 520 });
  const [gestureOn, setGestureOn] = useState(false);
  const [guides, setGuides] = useState({ x: false, y: false });

  const elements = [...(design.surfaces[surface]?.elements ?? [])].sort((a, b) => a.z - b.z);
  const selected = elements.find((element) => element.id === selectedId) ?? null;

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setViewport({ w: rect.width, h: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  let shirtW = viewport.w;
  let shirtH = shirtW / SHIRT_ASPECT;
  if (shirtH > viewport.h) {
    shirtH = viewport.h;
    shirtW = shirtH * SHIRT_ASPECT;
  }
  const zoom = enlarged ? 1.55 : 1;
  shirtW *= zoom;
  shirtH *= zoom;
  const areaW = Math.max(1, area.w * shirtW);
  const areaH = Math.max(1, area.h * shirtH);
  const focusX = (area.x + area.w / 2) * shirtW;
  const focusY = (area.y + area.h / 2) * shirtH;
  const offsetX = enlarged ? viewport.w / 2 - focusX : (viewport.w - shirtW) / 2;
  const offsetY = enlarged ? viewport.h / 2 - focusY : (viewport.h - shirtH) / 2;
  const areaLeft = area.x * shirtW;
  const areaTop = area.y * shirtH;

  const metrics = useRef({ areaW, areaH, areaLeft, areaTop, offsetX, offsetY });
  metrics.current = { areaW, areaH, areaLeft, areaTop, offsetX, offsetY };
  const handlers = useRef({ onPatch, onEnd, onEdit, onSelect });
  handlers.current = { onPatch, onEnd, onEdit, onSelect };

  useLayoutEffect(() => {
    if (gestureRef.current) return;
    for (const element of elements) {
      if (element.type !== "text") continue;
      const node = textRefs.current[element.id];
      if (!node) continue;
      const w = node.offsetWidth / areaW;
      const h = Math.max(node.offsetHeight, 1) / areaH;
      if (Math.abs(w - element.w) > 0.012 || Math.abs(h - element.h) > 0.012) onFitText(element.id, w, h);
    }
  });

  useEffect(() => {
    if (!gestureOn) return;
    const applyDrag = (gesture: Gesture, clientX: number, clientY: number) => {
      const { areaW: width, areaH: height } = metrics.current;
      const dx = (clientX - gesture.startClientX) / width;
      const dy = (clientY - gesture.startClientY) / height;
      let x = clamp(gesture.originX + dx, 0, 1);
      let y = clamp(gesture.originY + dy, 0, 1);
      const guideX = Math.abs(x - 0.5) * width < 7;
      const guideY = Math.abs(y - 0.5) * height < 7;
      if (guideX) x = 0.5;
      if (guideY) y = 0.5;
      setGuides({ x: guideX, y: guideY });
      handlers.current.onPatch(gesture.id, { x, y });
    };

    const applyRotate = (gesture: Gesture, clientX: number, clientY: number, distance: number, angle: number) => {
      const { areaW: width, areaH: height } = metrics.current;
      const scale = clamp(distance / Math.max(gesture.startDist, 1), 0.15, 6);
      const minW = 32 / width;
      const minH = 32 / height;
      const patch: Patch = {
        w: clamp(gesture.originW * scale, minW, 3.5),
        h: clamp(gesture.originH * scale, minH, 3.5),
        rotation: snapAngle(gesture.originRotation + ((angle - gesture.startAngle) * 180) / Math.PI),
      };
      if (gesture.originFont > 0) patch.fontSize = clamp(gesture.originFont * scale, 24, 1800);
      handlers.current.onPatch(gesture.id, patch);
    };

    const applyEdge = (gesture: Gesture, clientX: number, clientY: number) => {
      const stage = stageRef.current?.getBoundingClientRect();
      if (!stage) return;
      const { areaW: width, areaH: height, areaLeft: left, areaTop: top, offsetX: ox, offsetY: oy } = metrics.current;
      const px = (clientX - stage.left - ox - left) / width;
      const py = (clientY - stage.top - oy - top) / height;
      const minW = 32 / width;
      const minH = 32 / height;
      if (gesture.mode === "left" || gesture.mode === "right") {
        const edge = gesture.mode === "left" ? gesture.originX + gesture.originW / 2 : gesture.originX - gesture.originW / 2;
        const nextW = clamp(gesture.mode === "left" ? edge - px : px - edge, minW, 3.5);
        const nextX = gesture.mode === "left" ? edge - nextW / 2 : edge + nextW / 2;
        handlers.current.onPatch(gesture.id, { w: nextW, x: clamp(nextX, 0, 1) });
        return;
      }
      const edge = gesture.mode === "top" ? gesture.originY + gesture.originH / 2 : gesture.originY - gesture.originH / 2;
      const nextH = clamp(gesture.mode === "top" ? edge - py : py - edge, minH, 3.5);
      const nextY = gesture.mode === "top" ? edge - nextH / 2 : edge + nextH / 2;
      handlers.current.onPatch(gesture.id, { h: nextH, y: clamp(nextY, 0, 1) });
    };

    const move = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (Math.hypot(event.clientX - gesture.startClientX, event.clientY - gesture.startClientY) > 4) gesture.moved = true;
      const points = [...pointers.current.values()];
      if (points.length >= 2 && (gesture.mode === "drag" || gesture.mode === "pinch")) {
        const [first, second] = points;
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        const angle = Math.atan2(second.y - first.y, second.x - first.x);
        if (gesture.mode !== "pinch") {
          gesture.mode = "pinch";
          gesture.startDist = Math.max(distance, 1);
          gesture.startAngle = angle;
          gesture.originW = gesture.originW;
          gesture.originH = gesture.originH;
        }
        applyRotate(gesture, event.clientX, event.clientY, distance, angle);
        return;
      }
      if (gesture.mode === "drag") applyDrag(gesture, event.clientX, event.clientY);
      else if (gesture.mode === "rotate") {
        const distance = Math.hypot(event.clientX - gesture.centerX, event.clientY - gesture.centerY);
        const angle = Math.atan2(event.clientY - gesture.centerY, event.clientX - gesture.centerX);
        applyRotate(gesture, event.clientX, event.clientY, distance, angle);
      } else applyEdge(gesture, event.clientX, event.clientY);
    };

    const finish = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      const gesture = gestureRef.current;
      if (!gesture) return;
      if (pointers.current.size > 0 && gesture.mode !== "pinch") return;
      pointers.current.clear();
      if (!gesture.moved && gesture.mode === "drag") {
        const now = Date.now();
        if (now - lastTap.current.at < 280 && lastTap.current.id === gesture.id) {
          handlers.current.onEdit(gesture.id);
          lastTap.current = { at: 0, id: "" };
        } else lastTap.current = { at: now, id: gesture.id };
      }
      gestureRef.current = null;
      setGestureOn(false);
      setGuides({ x: false, y: false });
      handlers.current.onEnd();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [gestureOn]);

  function centerOf(element: DesignElement) {
    const stage = stageRef.current?.getBoundingClientRect();
    const { areaW: width, areaH: height, areaLeft: left, areaTop: top, offsetX: ox, offsetY: oy } = metrics.current;
    return {
      x: (stage?.left ?? 0) + ox + left + element.x * width,
      y: (stage?.top ?? 0) + oy + top + element.y * height,
    };
  }

  function begin(element: DesignElement, mode: Mode, event: ReactPointerEvent) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    onSelect(element.id);
    onBegin();
    const center = centerOf(element);
    const fontSize = element.type === "text" ? element.fontSize : 0;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gestureRef.current = {
      id: element.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: element.x,
      originY: element.y,
      originW: element.w,
      originH: element.h,
      originRotation: element.rotation,
      originFont: fontSize,
      centerX: center.x,
      centerY: center.y,
      startDist: Math.max(Math.hypot(event.clientX - center.x, event.clientY - center.y), 1),
      startAngle: Math.atan2(event.clientY - center.y, event.clientX - center.x),
      moved: false,
    };
    setGestureOn(true);
  }

  const hideChrome = gestureOn && gestureRef.current?.mode === "drag";

  return (
    <div ref={stageRef} className="absolute inset-0 touch-none overflow-hidden select-none" onPointerDown={() => onSelect(null)}>
      <div className="absolute" style={{ left: offsetX, top: offsetY, width: shirtW, height: shirtH }}>
        <ShirtImage src={mockupUrl} />
        <div
          className="absolute overflow-hidden"
          style={{ left: areaLeft, top: areaTop, width: areaW, height: areaH, outline: "1px dashed rgba(26,24,20,0.45)", outlineOffset: -1 }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onSelect(null);
            event.stopPropagation();
          }}
        >
          {guides.x ? <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px -translate-x-1/2 bg-red-500" /> : null}
          {guides.y ? <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px -translate-y-1/2 bg-red-500" /> : null}
          {elements.map((element) => {
            const boxW = element.w * areaW;
            const boxH = element.h * areaH;
            const left = element.x * areaW - boxW / 2;
            const top = element.y * areaH - boxH / 2;
            return (
              <div
                key={element.id}
                className="absolute"
                style={{ left, top, width: boxW, height: boxH, transform: `rotate(${element.rotation}deg)`, transformOrigin: "center", zIndex: element.z }}
                onPointerDown={(event) => begin(element, "drag", event)}
              >
                <div className={element.id === bornId ? "print-in h-full w-full" : "h-full w-full"}>
                {element.type === "text" ? (
                  <span
                    ref={(node) => {
                      textRefs.current[element.id] = node;
                    }}
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                    style={{
                      color: element.color,
                      fontSize: element.fontSize * (areaW / area.exportWidth),
                      fontFamily: "PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif",
                      lineHeight: 1.05,
                    }}
                  >
                    {element.text}
                  </span>
                ) : (
                  <img src={library.find((item) => item.id === element.assetId)?.url || ""} alt="" draggable={false} className="pointer-events-none h-full w-full object-contain" />
                )}
                </div>
              </div>
            );
          })}
        </div>
        {selected ? (
          <Selection
            element={selected}
            areaW={areaW}
            areaH={areaH}
            areaLeft={areaLeft}
            areaTop={areaTop}
            hideChrome={hideChrome}
            onDrag={(event) => begin(selected, "drag", event)}
            onRotate={(event) => begin(selected, "rotate", event)}
            onResize={(edge, event) => begin(selected, edge, event)}
            onEdit={() => onEdit(selected.id)}
            onDelete={() => onDelete(selected.id)}
          />
        ) : null}
      </div>
    </div>
  );
}

function Selection({
  element,
  areaW,
  areaH,
  areaLeft,
  areaTop,
  hideChrome,
  onDrag,
  onRotate,
  onResize,
  onEdit,
  onDelete,
}: {
  element: DesignElement;
  areaW: number;
  areaH: number;
  areaLeft: number;
  areaTop: number;
  hideChrome: boolean;
  onDrag: (event: ReactPointerEvent) => void;
  onRotate: (event: ReactPointerEvent) => void;
  onResize: (edge: "left" | "right" | "top" | "bottom", event: ReactPointerEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const boxW = element.w * areaW;
  const boxH = element.h * areaH;
  const left = areaLeft + element.x * areaW - boxW / 2;
  const top = areaTop + element.y * areaH - boxH / 2;
  return (
    <div
      className="absolute z-30"
      style={{ left, top, width: boxW, height: boxH, transform: `rotate(${element.rotation}deg)`, transformOrigin: "center" }}
      onPointerDown={onDrag}
    >
      <div className="pointer-events-none absolute inset-0 outline outline-2 outline-white outline-offset-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.28)]" />
      {hideChrome ? null : (
        <>
          <RoundButton className="-left-3 -top-3" label="删除" onClick={onDelete}>
            <XIcon className="size-3.5" />
          </RoundButton>
          <RoundButton className="-bottom-3 -left-3" label="编辑" onClick={onEdit}>
            <PencilIcon className="size-3.5" />
          </RoundButton>
          <button
            type="button"
            aria-label="旋转缩放"
            className="absolute -right-3.5 -bottom-3.5 flex size-7 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md"
            onPointerDown={onRotate}
          >
            <RotateCwIcon className="size-3.5" />
          </button>
          {element.type === "image" ? (
            <>
              <Edge edge="left" onPointerDown={(event) => onResize("left", event)} />
              <Edge edge="right" onPointerDown={(event) => onResize("right", event)} />
              <Edge edge="top" onPointerDown={(event) => onResize("top", event)} />
              <Edge edge="bottom" onPointerDown={(event) => onResize("bottom", event)} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function RoundButton({ className, label, onClick, children }: { className: string; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`absolute flex size-6 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md ${className}`}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.preventDefault();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function Edge({ edge, onPointerDown }: { edge: "left" | "right" | "top" | "bottom"; onPointerDown: (event: ReactPointerEvent) => void }) {
  const horizontal = edge === "left" || edge === "right";
  const place = {
    left: "top-1/2 left-0 h-2/5 w-1.5 -translate-x-1/2 -translate-y-1/2",
    right: "top-1/2 right-0 h-2/5 w-1.5 translate-x-1/2 -translate-y-1/2",
    top: "top-0 left-1/2 h-1.5 w-2/5 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-0 left-1/2 h-1.5 w-2/5 -translate-x-1/2 translate-y-1/2",
  }[edge];
  return (
    <button
      type="button"
      aria-label={horizontal ? "调整宽度" : "调整高度"}
      className={`absolute rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)] ${place}`}
      onPointerDown={onPointerDown}
    />
  );
}
