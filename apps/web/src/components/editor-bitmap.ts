function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("图片导出失败"))), "image/png");
  });
}

function fitSize(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function cropToPng(url: string, region: { x: number; y: number; w: number; h: number }) {
  const image = await loadImage(url);
  const sx = Math.max(0, Math.round(region.x));
  const sy = Math.max(0, Math.round(region.y));
  const sw = Math.max(1, Math.min(image.naturalWidth - sx, Math.round(region.w)));
  const sh = Math.max(1, Math.min(image.naturalHeight - sy, Math.round(region.h)));
  const size = fitSize(sw, sh, 1600);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法处理图片");
  context.drawImage(image, sx, sy, sw, sh, 0, 0, size.width, size.height);
  const blob = await canvasBlob(canvas);
  return { blob, width: size.width, height: size.height };
}

export async function eraseToPng(source: HTMLCanvasElement) {
  const size = fitSize(source.width, source.height, 1600);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法处理图片");
  context.drawImage(source, 0, 0, size.width, size.height);
  const blob = await canvasBlob(canvas);
  return { blob, width: size.width, height: size.height };
}

export async function knockOutBackdrop(url: string) {
  const image = await loadImage(url);
  const size = fitSize(image.naturalWidth, image.naturalHeight, 1600);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("无法处理图片");
  context.drawImage(image, 0, 0, size.width, size.height);
  const pixels = context.getImageData(0, 0, size.width, size.height);
  const { data, width, height } = pixels;
  const corners = [0, width - 1, (height - 1) * width, width * height - 1];
  let red = 0;
  let green = 0;
  let blue = 0;
  let opaque = 0;
  for (const index of corners) {
    const offset = index * 4;
    if (data[offset + 3] < 16) continue;
    red += data[offset];
    green += data[offset + 1];
    blue += data[offset + 2];
    opaque += 1;
  }
  if (opaque === 0) return { blob: await canvasBlob(canvas), width: size.width, height: size.height, changed: false };
  red /= opaque;
  green /= opaque;
  blue /= opaque;
  let cleared = 0;
  const total = width * height;
  for (let index = 0; index < total; index += 1) {
    const offset = index * 4;
    const alpha = data[offset + 3];
    if (alpha < 8) continue;
    const distance = Math.hypot(data[offset] - red, data[offset + 1] - green, data[offset + 2] - blue);
    if (distance < 38) {
      data[offset + 3] = 0;
      cleared += 1;
    } else if (distance < 68) {
      data[offset + 3] = Math.round(alpha * ((distance - 38) / 30));
      cleared += 1;
    }
  }
  if (cleared < total * 0.004) return { blob: await canvasBlob(canvas), width: size.width, height: size.height, changed: false };
  context.putImageData(pixels, 0, 0);
  return { blob: await canvasBlob(canvas), width: size.width, height: size.height, changed: true };
}
