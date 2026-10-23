"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HouseIcon, ShoppingBagIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type DetailBlock = { type: "text" | "image"; content: string };

export function ProductView({
  slug,
  productId,
  name,
  price,
  detail,
  printNote,
  colors,
  gallery,
  blocks,
  sizes,
}: {
  slug: string;
  productId: string;
  name: string;
  price: string;
  detail: string;
  printNote: string;
  colors: { id: string; name: string; hex: string; frontUrl: string; backUrl: string | null }[];
  gallery: string[];
  blocks: DetailBlock[];
  sizes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const sizeRef = useRef<HTMLDivElement>(null);
  const [colorId, setColorId] = useState(colors[0]?.id ?? "");
  const [sizeId, setSizeId] = useState("");
  const [shakeSize, setShakeSize] = useState(false);
  const color = colors.find((item) => item.id === colorId) ?? colors[0];
  const size = sizes.find((item) => item.id === sizeId);
  const images = unique([color?.frontUrl, color?.backUrl, ...gallery]);
  const description = blocks.length > 0 ? blocks : detail ? [{ type: "text" as const, content: detail }] : [];
  function customize() {
    if (sizes.length > 0 && !sizeId) {
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setShakeSize(true);
      window.setTimeout(() => setShakeSize(false), 420);
      return;
    }
    const query = new URLSearchParams();
    if (sizeId) query.set("size", sizeId);
    if (color) query.set("color", color.id);
    router.push(`/s/${slug}/design/${productId}?${query.toString()}`);
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <Gallery images={images} label={name} />
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-semibold tabular-nums">{price}</p>
            <p className="text-xs text-muted-foreground">底衫价格，有图案的印面另加价{printNote ? ` · ${printNote}` : ""}</p>
          </div>
          <h1 className="text-base leading-snug font-medium">{name}</h1>
          {colors.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">颜色{color ? ` · ${color.name}` : ""}</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((item) => (
                  <Button key={item.id} type="button" size="sm" variant={item.id === color?.id ? "default" : "outline"} onClick={() => setColorId(item.id)}>
                    <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: item.hex }} />
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {sizes.length > 0 ? (
            <div ref={sizeRef} className={cn("flex flex-col gap-2", shakeSize && "shake")}>
              <p className={cn("text-sm", shakeSize ? "text-destructive" : "text-muted-foreground")}>{shakeSize ? "请先选择尺码" : `尺码${size ? ` · ${size.name}` : " · 请选择"}`}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((item) => (
                  <Button key={item.id} type="button" size="sm" variant={item.id === sizeId ? "default" : "outline"} onClick={() => setSizeId(item.id)}>
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {description.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">详情</span>
                <Separator className="flex-1" />
              </div>
              <div className="flex flex-col gap-3">
                {description.map((block, index) => (
                  block.type === "image" ? (
                    <img key={`${block.content}-${index}`} src={block.content} alt="" className="w-full" />
                  ) : (
                    <p key={`${block.content}-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{block.content}</p>
                  )
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t bg-background px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Link href={`/s/${slug}`} className="pressable flex w-10 flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
          <HouseIcon className="size-5" />
          首页
        </Link>
        <Link href={`/s/${slug}/cart`} className="pressable flex w-10 flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
          <ShoppingBagIcon className="size-5" />
          购物车
        </Link>
        <Button className="pressable flex-1" size="lg" type="button" onClick={customize}>去定制</Button>
      </div>
    </div>
  );
}

const garment = "aspect-square w-full shrink-0 snap-center object-contain p-6 drop-shadow-[0_16px_14px_rgba(40,32,24,0.22)]";

function Gallery({ images, label }: { images: string[]; label: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const frameRef = useRef(images);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [frame, setFrame] = useState(images);
  const [incoming, setIncoming] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const imageKey = images.join("\n");
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      if (el.clientWidth === 0) return;
      setIndex(Math.round(el.scrollLeft / el.clientWidth));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const next = imagesRef.current;
    if (next.join("\n") === frameRef.current.join("\n")) return;
    const apply = () => {
      frameRef.current = next;
      setFrame(next);
      setIncoming(null);
      setIndex(0);
      if (scroller.current) scroller.current.scrollLeft = 0;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }
    setIncoming(next);
    const timer = window.setTimeout(apply, 180);
    return () => window.clearTimeout(timer);
  }, [imageKey]);
  function go(next: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }
  if (frame.length === 0 && !incoming) return <div className="aspect-square w-full shrink-0 bg-[#e8e4dc]" />;
  const dots = incoming ?? frame;
  const dotIndex = incoming ? 0 : index;
  return (
    <div className="relative shrink-0 bg-[#e8e4dc]">
      <div ref={scroller} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {frame.map((url, imageIndex) => (
          <img key={`${url}-${imageIndex}`} src={url} alt={imageIndex === 0 ? label : ""} className={garment} />
        ))}
      </div>
      {incoming?.[0] ? (
        <div className="img-in pointer-events-none absolute inset-0 bg-[#e8e4dc]">
          <img src={incoming[0]} alt="" className={garment} />
        </div>
      ) : null}
      {dots.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {dots.map((url, dot) => (
            <button
              key={`${url}-${dot}`}
              type="button"
              aria-label={`第 ${dot + 1} 张`}
              className="flex size-4 items-center justify-center"
              onClick={() => go(dot)}
            >
              <span className={cn("size-1.5 rounded-full", dot === dotIndex ? "bg-neutral-900" : "bg-neutral-900/25")} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function unique(values: Array<string | null | undefined>) {
  return values.filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index);
}
