"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, CropIcon, EraserIcon, ImageMinusIcon, ImagePlusIcon, Maximize2Icon, Minimize2Icon, Redo2Icon, StickerIcon, TypeIcon, Undo2Icon } from "lucide-react";
import { formatYuan, orderPrice, type DesignDocumentV1, type DesignElement, type SurfaceId } from "@tshirt/design";
import { CropSheet, EraserSheet, FONT_COLORS } from "./editor-panels";
import { EditorStage } from "./editor-stage";
import type { EditorProps, LibraryItem } from "./editor-types";
import { cropToPng, eraseToPng, knockOutBackdrop } from "./editor-bitmap";
import { useShopLogin } from "@/components/shop-login";

export type { EditorProps } from "./editor-types";

type Panel = "none" | "material" | "font" | "photo" | "tools" | "buy" | "crop" | "eraser";

function storageKey(slug: string, productId: string) {
  return `tshirt-design:${slug}:${productId}`;
}

function fingerprint(design: DesignDocumentV1) {
  return JSON.stringify(design, (key, value) => (key === "z" ? undefined : value));
}

function blank(product: EditorProps["product"]): DesignDocumentV1 {
  return {
    version: 1,
    productId: product.id,
    colorId: product.colors[0]?.id || "",
    surfaces: {
      front: { elements: [] },
      ...(product.areas.some((area) => area.surface === "back") ? { back: { elements: [] } } : {}),
    },
  };
}

function applyPreference(
  draft: { design: DesignDocumentV1; sizeId: string; quantity: number; surface: SurfaceId },
  product: EditorProps["product"],
  preferredSize?: string,
  preferredColor?: string,
) {
  if (preferredSize && product.sizes.some((size) => size.id === preferredSize)) draft.sizeId = preferredSize;
  if (preferredColor && product.colors.some((color) => color.id === preferredColor)) {
    draft.design = { ...draft.design, colorId: preferredColor };
  }
  return draft;
}

function readDraft(
  slug: string,
  product: EditorProps["product"],
  preferredSize?: string,
  preferredColor?: string,
): { design: DesignDocumentV1; sizeId: string; quantity: number; surface: SurfaceId } {
  const fallback = { design: blank(product), sizeId: product.sizes[0]?.id || "", quantity: 1, surface: "front" as SurfaceId };
  const prefer = (draft: typeof fallback) => applyPreference(draft, product, preferredSize, preferredColor);
  if (typeof window === "undefined") return prefer(fallback);
  try {
    const saved = window.sessionStorage.getItem(storageKey(slug, product.id));
    if (!saved) return prefer(fallback);
    const parsed = JSON.parse(saved) as { document?: DesignDocumentV1; version?: number; sizeId?: string; quantity?: number; surface?: SurfaceId };
    const design = parsed.version === 1 ? (parsed as DesignDocumentV1) : parsed.document;
    if (!design || design.version !== 1 || design.productId !== product.id) return prefer(fallback);
    return prefer({
      design,
      sizeId: product.sizes.some((size) => size.id === parsed.sizeId) ? parsed.sizeId! : fallback.sizeId,
      quantity: typeof parsed.quantity === "number" && parsed.quantity >= 1 && parsed.quantity <= 20 ? parsed.quantity : 1,
      surface: parsed.surface === "back" && product.areas.some((area) => area.surface === "back") ? "back" : "front",
    });
  } catch {
    return prefer(fallback);
  }
}

function inkOn(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160 ? "#171717" : "#ffffff";
}

export default function EditorCanvas({ slug, loggedIn, product, materials, initialSizeId, initialColorId }: EditorProps) {
  const { openLogin } = useShopLogin();
  const draft = useRef(readDraft(slug, product, initialSizeId, initialColorId)).current;
  const [design, setDesign] = useState(draft.design);
  const [surface, setSurface] = useState<SurfaceId>(draft.surface);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState(draft.sizeId);
  const [quantity, setQuantity] = useState(draft.quantity);
  const [past, setPast] = useState<DesignDocumentV1[]>([]);
  const [future, setFuture] = useState<DesignDocumentV1[]>([]);
  const [uploads, setUploads] = useState<LibraryItem[]>([]);
  const [panel, setPanel] = useState<Panel>("none");
  const [enlarged, setEnlarged] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [bornId, setBornId] = useState<string | null>(null);
  const bornTimer = useRef<number | null>(null);
  const designRef = useRef(design);
  const surfaceRef = useRef(surface);
  const baseline = useRef<DesignDocumentV1 | null>(null);
  const holding = useRef(false);
  const suppressTools = useRef<string | null>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  designRef.current = design;
  surfaceRef.current = surface;

  const library = [...materials, ...uploads];
  const area = product.areas.find((item) => item.surface === surface) ?? product.areas[0];
  const color = product.colors.find((item) => item.id === design.colorId) ?? product.colors[0];
  const elements = design.surfaces[surface]?.elements ?? [];
  const selected = elements.find((element) => element.id === selectedId) ?? null;
  const mockup = surface === "back" ? color?.backUrl || color?.frontUrl : color?.frontUrl;
  const hasBack = product.areas.some((item) => item.surface === "back");
  const hasArt = (["front", "back"] as const).some((side) => (design.surfaces[side]?.elements.length ?? 0) > 0);

  const price = useMemo(
    () => orderPrice({ lines: [{ baseCents: product.priceCents, quantity, document: design, areas: product.areas }], shipping: { type: "FLAT", flatCents: 0, thresholdCents: null } }),
    [design, product.areas, product.priceCents, quantity],
  );

  useEffect(() => {
    window.sessionStorage.setItem(storageKey(slug, product.id), JSON.stringify({ document: design, sizeId, quantity, surface }));
  }, [design, product.id, quantity, sizeId, slug, surface]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function write(next: DesignDocumentV1) {
    designRef.current = next;
    setDesign(next);
  }

  function apply(recipe: (current: DesignDocumentV1) => DesignDocumentV1) {
    write(recipe(designRef.current));
  }

  function commit(next: DesignDocumentV1) {
    const previous = designRef.current;
    if (fingerprint(previous) !== fingerprint(next)) {
      setPast((items) => [...items, previous].slice(-30));
      setFuture([]);
    }
    write(next);
  }

  function beginGesture() {
    if (holding.current || baseline.current) return;
    baseline.current = designRef.current;
  }

  function endGesture() {
    if (holding.current) return;
    const before = baseline.current;
    baseline.current = null;
    if (before && fingerprint(before) !== fingerprint(designRef.current)) {
      setPast((items) => [...items, before].slice(-30));
      setFuture([]);
    }
  }

  function openFontSession() {
    if (holding.current) return;
    baseline.current = designRef.current;
    holding.current = true;
  }

  function closeFontSession() {
    if (!holding.current) return;
    holding.current = false;
    const before = baseline.current;
    baseline.current = null;
    if (before && fingerprint(before) !== fingerprint(designRef.current)) {
      setPast((items) => [...items, before].slice(-30));
      setFuture([]);
    }
  }

  function mutateSurface(current: DesignDocumentV1, side: SurfaceId, nextElements: DesignElement[]): DesignDocumentV1 {
    return { ...current, surfaces: { ...current.surfaces, [side]: { elements: nextElements } } };
  }

  function patchElement(id: string, patch: Partial<DesignElement>) {
    const side = surfaceRef.current;
    apply((current) => mutateSurface(current, side, (current.surfaces[side]?.elements ?? []).map((element) => (element.id === id ? { ...element, ...patch } as DesignElement : element))));
  }

  function bringForward(id: string) {
    const side = surfaceRef.current;
    apply((current) => {
      const list = current.surfaces[side]?.elements ?? [];
      const max = list.reduce((highest, element) => Math.max(highest, element.z), 0);
      const ranked = max >= 100 ? [...list].sort((a, b) => a.z - b.z).map((element, index) => ({ ...element, z: index + 1 })) : list;
      const top = Math.min(100, ranked.reduce((highest, element) => Math.max(highest, element.z), 0) + 1);
      return mutateSurface(current, side, ranked.map((element) => (element.id === id ? { ...element, z: top } : element)));
    });
  }

  function select(id: string | null) {
    if (id !== selectedId) closeFontSession();
    setSelectedId(id);
    if (!id) {
      setPanel((current) => (current === "tools" || current === "font" ? "none" : current));
      return;
    }
    if (suppressTools.current !== id) suppressTools.current = null;
    bringForward(id);
    const element = (designRef.current.surfaces[surfaceRef.current]?.elements ?? []).find((item) => item.id === id);
    if (!element) return;
    setPanel((current) => {
      if (element.type === "image" && suppressTools.current !== id && (current === "none" || current === "font")) return "tools";
      if (element.type === "text" && current === "tools") return "none";
      return current;
    });
  }

  function undo() {
    setPast((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setFuture((queue) => [designRef.current, ...queue]);
      write(previous);
      setSelectedId(null);
      return items.slice(0, -1);
    });
  }

  function redo() {
    setFuture((queue) => {
      const next = queue[0];
      if (!next) return queue;
      setPast((items) => [...items, designRef.current].slice(-30));
      write(next);
      setSelectedId(null);
      return queue.slice(1);
    });
  }

  function countGuard() {
    if (elements.length >= 20) {
      setMessage("这一面最多放 20 个元素");
      return true;
    }
    return false;
  }

  function reveal(id: string) {
    setBornId(id);
    if (bornTimer.current) window.clearTimeout(bornTimer.current);
    bornTimer.current = window.setTimeout(() => setBornId((current) => (current === id ? null : current)), 220);
  }

  function addElement(element: DesignElement) {
    const side = surfaceRef.current;
    commit(mutateSurface(designRef.current, side, [...(designRef.current.surfaces[side]?.elements ?? []), element]));
    setSelectedId(element.id);
    reveal(element.id);
  }

  function addText() {
    if (!area || countGuard()) return;
    const list = designRef.current.surfaces[surfaceRef.current]?.elements ?? [];
    const fontSize = 680;
    const element: DesignElement = {
      id: crypto.randomUUID(),
      type: "text",
      text: "你的文字",
      fontId: "sans",
      fontSize,
      color: "#171717",
      x: 0.5,
      y: 0.42,
      w: Math.min(0.86, (4 * fontSize) / area.exportWidth),
      h: (fontSize * 1.15) / area.exportHeight,
      rotation: 0,
      z: list.length + 1,
    };
    openFontSession();
    const side = surfaceRef.current;
    write(mutateSurface(designRef.current, side, [...list, element]));
    setSelectedId(element.id);
    reveal(element.id);
    setPanel("font");
  }

  function addImage(item: LibraryItem) {
    const currentArea = product.areas.find((entry) => entry.surface === surfaceRef.current) ?? product.areas[0];
    const list = designRef.current.surfaces[surfaceRef.current]?.elements ?? [];
    if (!currentArea || list.length >= 20) {
      if (list.length >= 20) setMessage("这一面最多放 20 个元素");
      return;
    }
    const aspect = item.width / Math.max(1, item.height);
    const w = 0.46;
    addElement({
      id: crypto.randomUUID(),
      type: "image",
      assetId: item.id,
      x: 0.5,
      y: 0.42,
      w,
      h: (w * currentArea.exportWidth) / (aspect * currentArea.exportHeight),
      rotation: 0,
      z: list.length + 1,
    });
    setPanel("tools");
  }

  function remove(id: string) {
    const side = surfaceRef.current;
    const next = mutateSurface(designRef.current, side, (designRef.current.surfaces[side]?.elements ?? []).filter((element) => element.id !== id));
    if (holding.current) {
      write(next);
      closeFontSession();
    } else commit(next);
    setSelectedId(null);
    setPanel((current) => (current === "tools" || current === "font" || current === "crop" || current === "eraser" ? "none" : current));
  }

  function fitText(id: string, w: number, h: number) {
    const side = surfaceRef.current;
    const element = (designRef.current.surfaces[side]?.elements ?? []).find((item) => item.id === id);
    if (!element || element.type !== "text") return;
    const nextW = Math.min(3.5, Math.max(0.02, Math.round(w * 1000) / 1000));
    const nextH = Math.min(3.5, Math.max(0.02, Math.round(h * 1000) / 1000));
    if (Math.abs(element.w - nextW) < 0.008 && Math.abs(element.h - nextH) < 0.008) return;
    patchElement(id, { w: nextW, h: nextH });
  }

  function edit(id: string) {
    const element = elements.find((item) => item.id === id);
    if (!element) return;
    if (element.type === "text") {
      openFontSession();
      setPanel("font");
      return;
    }
    suppressTools.current = null;
    setPanel("tools");
  }

  async function uploadFile(file: File) {
    if (!loggedIn) {
      openLogin(`/s/${slug}/design/${product.id}`);
      return null;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("slug", slug);
    const response = await fetch("/api/uploads", { method: "POST", body });
    const data = (await response.json()) as { id?: string; width?: number; height?: number; objectKey?: string; error?: string };
    if (!response.ok || !data.id || !data.width || !data.height || !data.objectKey) {
      setMessage(data.error || "上传失败");
      return null;
    }
    const item = { id: data.id, name: file.name, url: `/api/media/${data.objectKey.split("/").map(encodeURIComponent).join("/")}`, width: data.width, height: data.height };
    setUploads((items) => [...items, item]);
    return item;
  }

  async function onPick(file: File | undefined) {
    setPanel("none");
    if (!file) return;
    setBusy(true);
    const item = await uploadFile(file);
    setBusy(false);
    if (item) addImage(item);
  }

  async function replaceImage(targetId: string, blob: Blob, width: number, height: number) {
    const side = surfaceRef.current;
    const currentArea = product.areas.find((entry) => entry.surface === side);
    if (!currentArea) return;
    setBusy(true);
    const item = await uploadFile(new File([blob], "edit.png", { type: "image/png" }));
    setBusy(false);
    if (!item) return;
    const aspect = width / Math.max(1, height);
    commit(mutateSurface(designRef.current, side, (designRef.current.surfaces[side]?.elements ?? []).map((element) => (
      element.id === targetId && element.type === "image"
        ? { ...element, assetId: item.id, h: (element.w * currentArea.exportWidth) / (aspect * currentArea.exportHeight) }
        : element
    ))));
    setPanel("tools");
  }

  async function checkout(replace: boolean) {
    setMessage("");
    const response = await fetch(`/api/shops/${slug}/cart`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id, colorId: design.colorId, sizeId, quantity, document: design, replace }),
    });
    if (response.status === 401) {
      openLogin(`/s/${slug}/design/${product.id}`);
      return;
    }
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "无法加入购物车");
      return;
    }
    window.location.href = replace ? `/s/${slug}/checkout` : `/s/${slug}/cart`;
  }

  async function saveDesign() {
    if (!loggedIn) {
      openLogin(`/s/${slug}/design/${product.id}`);
      return;
    }
    const response = await fetch(`/api/shops/${slug}/designs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ document: design }),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(response.ok ? "已保存到我的设计" : data.error || "保存失败");
  }

  function closeFont() {
    const current = (designRef.current.surfaces[surfaceRef.current]?.elements ?? []).find((element) => element.id === selectedId);
    if (current?.type === "text" && current.text.trim().length === 0) remove(current.id);
    else closeFontSession();
    setPanel("none");
  }

  const imageTarget = selected?.type === "image" ? selected : null;
  const selectedImage = imageTarget ? library.find((item) => item.id === imageTarget.assetId) : undefined;

  return (
    <div className="fixed inset-y-0 left-1/2 z-40 flex h-dvh w-full max-w-[430px] -translate-x-1/2 flex-col bg-[#f3efe6] text-neutral-900 lg:left-0 lg:max-w-none lg:translate-x-0">
      <header className="bg-white px-3 pt-[max(8px,env(safe-area-inset-top))] pb-2 lg:border-b lg:px-10 lg:py-3">
        <div className="flex items-center gap-2">
          <Link href={`/s/${slug}/products/${product.id}`} aria-label="返回" className="flex size-8 items-center justify-center rounded-full">
            <ChevronLeftIcon className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-xs text-neutral-500 tabular-nums">{formatYuan(price.goodsCents)}</p>
          </div>
          <button type="button" disabled={!hasArt} className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 lg:hidden" onClick={() => { closeFontSession(); setPanel("buy"); }}>
            立即购买
          </button>
          <button type="button" className="hidden rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium lg:inline-flex" onClick={() => void saveDesign()}>
            保存草稿
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto px-2 lg:hidden">
          {product.colors.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.name}
              className="size-7 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: item.hex }}
              onClick={() => commit({ ...designRef.current, colorId: item.id })}
            >
              {item.id === design.colorId ? <CheckIcon className="mx-auto size-3.5" style={{ color: inkOn(item.hex) }} /> : null}
            </button>
          ))}
        </div>
      </header>

      <aside className="absolute inset-y-[74px] left-0 z-20 hidden w-[92px] flex-col items-center gap-2 border-r border-black/5 bg-white py-8 lg:flex">
        <RailButton label="素材" active={panel === "material"} onClick={() => { closeFontSession(); setPanel(panel === "material" ? "none" : "material"); }}><StickerIcon /></RailButton>
        <RailButton label="文字" active={panel === "font"} onClick={() => { if (selected?.type === "text") { openFontSession(); setPanel("font"); } else addText(); }}><TypeIcon /></RailButton>
        <RailButton label="上传" active={panel === "photo"} onClick={() => albumRef.current?.click()}><ImagePlusIcon /></RailButton>
        <RailButton label="图层" active={panel === "tools"} onClick={() => setPanel(panel === "tools" ? "none" : "tools")}><CropIcon /></RailButton>
        <div className="my-3 h-px w-12 bg-neutral-200" />
        <RailButton label="撤销" disabled={!past.length} onClick={undo}><Undo2Icon /></RailButton>
        <RailButton label="重做" disabled={!future.length} onClick={redo}><Redo2Icon /></RailButton>
      </aside>

      <div className="relative min-h-0 flex-1 lg:ml-[92px] lg:mr-[390px] lg:bg-[#edf0f4]">
        {area && mockup ? (
          <EditorStage
            design={design}
            surface={surface}
            area={area}
            mockupUrl={mockup}
            library={library}
            selectedId={selectedId}
            enlarged={enlarged}
            onSelect={select}
            onPatch={patchElement}
            onFitText={fitText}
            onBegin={beginGesture}
            onEnd={endGesture}
            onEdit={edit}
            onDelete={remove}
            bornId={bornId}
          />
        ) : null}
        <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-center gap-2">
          <FloatButton label={enlarged ? "还原" : "放大"} onClick={() => setEnlarged((value) => !value)}>
            {enlarged ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
          </FloatButton>
          <FloatButton label="撤销" disabled={past.length === 0} onClick={undo}><Undo2Icon className="size-4" /></FloatButton>
          <FloatButton label="重做" disabled={future.length === 0} onClick={redo}><Redo2Icon className="size-4" /></FloatButton>
          {hasBack ? (
            <FloatButton label={surface === "front" ? "看背面" : "看正面"} onClick={() => { closeFontSession(); setSurface(surface === "front" ? "back" : "front"); setSelectedId(null); setPanel((current) => (current === "tools" || current === "font" ? "none" : current)); }}>
              <span className="text-[11px] font-medium">{surface === "front" ? "背面" : "正面"}</span>
            </FloatButton>
          ) : null}
        </div>
        {message ? <p className="absolute top-3 left-1/2 z-20 max-w-[80%] -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-1.5 text-center text-xs text-white">{message}</p> : null}
      </div>

      <aside className="absolute inset-y-[74px] right-4 z-20 hidden w-[360px] overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(30,35,45,0.08)] lg:block">
        <div className="flex border-b border-neutral-200"><button className="border-b-2 border-neutral-900 px-3 pb-3 text-base font-semibold">设计</button><span className="px-3 pb-3 text-base text-neutral-400">商品信息</span></div>
        <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" className={`rounded-xl border p-3 text-sm ${surface === "front" ? "border-neutral-900 bg-neutral-950 text-white" : "border-neutral-200"}`} onClick={() => setSurface("front")}>正面</button>{hasBack ? <button type="button" className={`rounded-xl border p-3 text-sm ${surface === "back" ? "border-neutral-900 bg-neutral-950 text-white" : "border-neutral-200"}`} onClick={() => setSurface("back")}>背面</button> : null}</div>
        <InspectorSection title="颜色"><div className="flex flex-wrap gap-3">{product.colors.map((item) => <button key={item.id} type="button" aria-label={item.name} className={`size-9 rounded-full border-2 ${item.id === design.colorId ? "border-neutral-900 ring-2 ring-neutral-200" : "border-white"}`} style={{ backgroundColor: item.hex }} onClick={() => commit({ ...designRef.current, colorId: item.id })}>{item.id === design.colorId ? <CheckIcon className="mx-auto size-4" style={{ color: inkOn(item.hex) }} /> : null}</button>)}</div></InspectorSection>
        <InspectorSection title="尺码"><div className="grid grid-cols-5 gap-2">{product.sizes.map((item) => <button key={item.id} type="button" className={`rounded-lg border py-2 text-sm ${item.id === sizeId ? "border-neutral-900 font-semibold" : "border-neutral-200"}`} onClick={() => setSizeId(item.id)}>{item.name}</button>)}</div></InspectorSection>
        <InspectorSection title="数量"><div className="flex w-40 items-center rounded-lg border border-neutral-200"><button type="button" className="w-12 py-2 text-lg" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span className="flex-1 border-x border-neutral-200 py-2 text-center tabular-nums">{quantity}</span><button type="button" className="w-12 py-2 text-lg" onClick={() => setQuantity((value) => Math.min(20, value + 1))}>＋</button></div></InspectorSection>
        <div className="mt-8 flex items-end justify-between border-t border-neutral-200 pt-5"><div><p className="text-sm text-neutral-500">单价</p><p className="text-3xl font-semibold">{formatYuan(price.goodsCents)}</p></div><button type="button" disabled={!hasArt} className="rounded-xl bg-neutral-950 px-6 py-3.5 text-sm font-medium text-white disabled:opacity-40" onClick={() => { closeFontSession(); void checkout(false); }}>加入购物车</button></div>
      </aside>

      {panel === "material" ? (
        <section className="sheet-up max-h-52 overflow-y-auto rounded-t-2xl bg-white px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:absolute lg:bottom-6 lg:left-[calc(92px+1.5rem)] lg:right-[calc(390px+2rem)] lg:z-30 lg:max-h-64 lg:rounded-2xl lg:shadow-lg">
          {library.length === 0 ? <p className="py-6 text-center text-sm text-neutral-500">还没有印花素材</p> : (
            <div className="grid grid-cols-4 gap-2">
              {library.map((item) => (
                <button key={item.id} type="button" className="pressable aspect-square overflow-hidden rounded-lg bg-neutral-100 p-1" onClick={() => addImage(item)}>
                  <img src={item.url} alt={item.name} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {panel === "font" && selected?.type === "text" ? (
        <section className="sheet-up flex max-h-[50%] flex-col gap-3 overflow-y-auto rounded-t-2xl bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:absolute lg:bottom-6 lg:left-[calc(92px+1.5rem)] lg:right-[calc(390px+2rem)] lg:z-30 lg:max-h-64 lg:rounded-2xl lg:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">文字</p>
            <button type="button" className="text-sm font-medium" onClick={closeFont}>完成</button>
          </div>
          <input
            value={selected.text}
            maxLength={40}
            className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-base outline-none"
            onChange={(event) => patchElement(selected.id, { text: event.target.value || " " })}
          />
          <div className="flex gap-2 overflow-x-auto">
            {FONT_COLORS.map((hex) => (
              <button key={hex} type="button" aria-label={hex} className="size-7 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: hex }} onClick={() => patchElement(selected.id, { color: hex })}>
                {selected.color.toLowerCase() === hex.toLowerCase() ? <CheckIcon className="mx-auto size-3.5" style={{ color: inkOn(hex) }} /> : null}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-xs text-neutral-500">
            字号
            <input
              className="w-full accent-neutral-900"
              type="range"
              min={80}
              max={900}
              value={selected.fontSize}
              onChange={(event) => patchElement(selected.id, { fontSize: Number(event.target.value) })}
            />
          </label>
        </section>
      ) : null}

      {panel === "photo" ? (
        <section className="sheet-up grid grid-cols-2 gap-3 rounded-t-2xl bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden">
          <button type="button" className="rounded-xl bg-neutral-100 py-4 text-sm" onClick={() => albumRef.current?.click()}>打开相册</button>
          <button type="button" className="rounded-xl bg-neutral-100 py-4 text-sm" onClick={() => cameraRef.current?.click()}>拍照</button>
        </section>
      ) : null}

      {panel === "tools" && imageTarget ? (
        <section className="sheet-up flex items-center justify-around rounded-t-2xl bg-white px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:absolute lg:bottom-6 lg:left-1/2 lg:z-30 lg:w-[360px] lg:-translate-x-1/2 lg:rounded-2xl lg:shadow-lg">
          <ToolButton label="收起" onClick={() => { suppressTools.current = imageTarget.id; setPanel("none"); }}><ChevronDownIcon className="size-5" /></ToolButton>
          <ToolButton label="去背景" onClick={() => {
            if (!selectedImage) return;
            setBusy(true);
            void knockOutBackdrop(selectedImage.url).then(async (result) => {
              if (!result.changed) setMessage("没有分离出纯色背景");
              else await replaceImage(imageTarget.id, result.blob, result.width, result.height);
            }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "处理失败")).finally(() => setBusy(false));
          }}><ImageMinusIcon className="size-5" /></ToolButton>
          <ToolButton label="裁剪" onClick={() => setPanel("crop")}><CropIcon className="size-5" /></ToolButton>
          <ToolButton label="橡皮擦" onClick={() => setPanel("eraser")}><EraserIcon className="size-5" /></ToolButton>
        </section>
      ) : null}

      {panel === "buy" ? (
        <section className="sheet-up flex max-h-[50%] flex-col gap-3 overflow-y-auto rounded-t-2xl bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden">
          <p className="text-sm font-medium">尺码</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button key={size.id} type="button" className={`min-w-10 rounded-full border px-3 py-1.5 text-sm ${size.id === sizeId ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"}`} onClick={() => setSizeId(size.id)}>{size.name}</button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">数量</p>
            <div className="flex items-center gap-3">
              <button type="button" className="size-8 rounded-full border" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
              <button type="button" className="size-8 rounded-full border" onClick={() => setQuantity((value) => Math.min(20, value + 1))}>+</button>
            </div>
          </div>
          <p className="text-sm text-neutral-500">商品 {formatYuan(price.goodsCents)}{price.printCents > 0 ? `，含印刷 ${formatYuan(price.printCents)}` : ""}，运费在结算时计算</p>
          {message ? <p className="text-sm text-red-600">{message}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="rounded-full border border-neutral-300 py-2.5 text-sm" onClick={() => void checkout(false)}>加入购物车</button>
            <button type="button" className="rounded-full bg-neutral-900 py-2.5 text-sm text-white" onClick={() => void checkout(true)}>去结算</button>
          </div>
          <button type="button" className="text-sm text-neutral-500" onClick={() => void saveDesign()}>保存设计</button>
        </section>
      ) : null}

      <footer className="grid grid-cols-3 border-t border-black/5 bg-white pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden">
        <DockButton label="印花素材" active={panel === "material"} onClick={() => { if (panel !== "material") closeFontSession(); setPanel(panel === "material" ? "none" : "material"); }}><StickerIcon className="size-5" /></DockButton>
        <DockButton label="文字" active={panel === "font"} onClick={() => { if (panel === "font") { closeFont(); return; } if (selected?.type === "text") { openFontSession(); setPanel("font"); return; } addText(); }}><TypeIcon className="size-5" /></DockButton>
        <DockButton label="来图定制" active={panel === "photo"} onClick={() => { if (panel !== "photo") closeFontSession(); setPanel(panel === "photo" ? "none" : "photo"); }}><ImagePlusIcon className="size-5" /></DockButton>
      </footer>
      <input ref={albumRef} className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(event) => { void onPick(event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={cameraRef} className="sr-only" type="file" accept="image/png,image/jpeg" capture="environment" onChange={(event) => { void onPick(event.target.files?.[0]); event.target.value = ""; }} />

      {panel === "crop" && imageTarget && selectedImage ? (
        <CropSheet url={selectedImage.url} busy={busy} onCancel={() => setPanel("tools")} onApply={(region) => {
          setBusy(true);
          void cropToPng(selectedImage.url, region).then((result) => replaceImage(imageTarget.id, result.blob, result.width, result.height)).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "裁剪失败")).finally(() => setBusy(false));
        }} />
      ) : null}
      {panel === "eraser" && imageTarget && selectedImage ? (
        <EraserSheet url={selectedImage.url} busy={busy} onCancel={() => setPanel("tools")} onApply={(canvas) => {
          setBusy(true);
          void eraseToPng(canvas).then((result) => replaceImage(imageTarget.id, result.blob, result.width, result.height)).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "处理失败")).finally(() => setBusy(false));
        }} />
      ) : null}
      {busy && panel !== "crop" && panel !== "eraser" ? <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 text-sm text-white">正在处理</div> : null}
    </div>
  );
}

function FloatButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} className="pressable pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-30" onClick={onClick}>
      {children}
    </button>
  );
}

function DockButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`pressable tab-ink flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-neutral-900" : "text-neutral-500"}`} onClick={onClick}>
      {children}
      {label}
    </button>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="flex flex-col items-center gap-1 px-3 py-1 text-[11px] text-neutral-700" onClick={onClick}>
      {children}
      {label}
    </button>
  );
}

function RailButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2 text-xs ${active ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-neutral-100"} disabled:opacity-30`}><span className="[&>svg]:size-5">{children}</span>{label}</button>;
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 border-t border-neutral-100 pt-5"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</section>;
}
