export function clamp(val: number, min: number = 0, max: number = 255): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

export function cloneImageData(source: ImageData): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  const copy = ctx.createImageData(source.width, source.height);
  copy.data.set(source.data);
  return copy;
}

export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = (h % 360) / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0,
    g = 0,
    b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [clamp(r * 255), clamp(g * 255), clamp(b * 255)];
}

/**
 * Apply 2D Convolution kernel to ImageData
 */
export function applyConvolution(
  src: ImageData,
  kernel: number[][],
  divisor: number = 1,
  offset: number = 0
): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const kRows = kernel.length;
  const kCols = kernel[0].length;
  const halfRow = Math.floor(kRows / 2);
  const halfCol = Math.floor(kCols / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = 0; ky < kRows; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky - halfRow));
        for (let kx = 0; kx < kCols; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - halfCol));
          const idx = (py * width + px) * 4;
          const weight = kernel[ky][kx];

          r += srcData[idx] * weight;
          g += srcData[idx + 1] * weight;
          b += srcData[idx + 2] * weight;
        }
      }

      const outIdx = (y * width + x) * 4;
      outData[outIdx] = clamp(r / divisor + offset);
      outData[outIdx + 1] = clamp(g / divisor + offset);
      outData[outIdx + 2] = clamp(b / divisor + offset);
      outData[outIdx + 3] = srcData[outIdx + 3]; // Preserve alpha
    }
  }

  return output;
}
