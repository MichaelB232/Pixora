import { clamp, cloneImageData, getLuminance } from "./core";
import { applyAdaptiveThreshold, applyContrast } from "./editor";
import { applySharpening } from "./restoration";

export interface Point2D {
  x: number;
  y: number;
}

export interface DocumentCorners {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

/**
 * Auto-detect document corners
 */
export function detectDocumentCorners(src: ImageData): DocumentCorners {
  const w = src.width;
  const h = src.height;

  // Default initial quad: 10% margin from borders
  return {
    topLeft: { x: Math.round(w * 0.1), y: Math.round(h * 0.08) },
    topRight: { x: Math.round(w * 0.9), y: Math.round(h * 0.12) },
    bottomRight: { x: Math.round(w * 0.88), y: Math.round(h * 0.92) },
    bottomLeft: { x: Math.round(w * 0.12), y: Math.round(h * 0.88) },
  };
}

/**
 * Bilinear quadrilateral perspective warp into a straight rectangle
 */
export function applyPerspectiveWarp(
  src: ImageData,
  corners: DocumentCorners,
  targetWidth?: number,
  targetHeight?: number
): ImageData {
  const w = targetWidth || src.width;
  const h = targetHeight || src.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const output = ctx.createImageData(w, h);
  const outData = output.data;
  const srcData = src.data;
  const sw = src.width;
  const sh = src.height;

  const { topLeft: p0, topRight: p1, bottomRight: p2, bottomLeft: p3 } = corners;

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);

      // Bilinear interpolation between 4 quad corners
      const topX = p0.x * (1 - u) + p1.x * u;
      const topY = p0.y * (1 - u) + p1.y * u;
      const botX = p3.x * (1 - u) + p2.x * u;
      const botY = p3.y * (1 - u) + p2.y * u;

      const srcX = Math.round(topX * (1 - v) + botX * v);
      const srcY = Math.round(topY * (1 - v) + botY * v);

      const sXClamped = Math.max(0, Math.min(sw - 1, srcX));
      const sYClamped = Math.max(0, Math.min(sh - 1, srcY));

      const srcIdx = (sYClamped * sw + sXClamped) * 4;
      const outIdx = (y * w + x) * 4;

      outData[outIdx] = srcData[srcIdx];
      outData[outIdx + 1] = srcData[srcIdx + 1];
      outData[outIdx + 2] = srcData[srcIdx + 2];
      outData[outIdx + 3] = 255;
    }
  }

  return output;
}

/**
 * Document Binarization (Crisp Black and White document for text)
 */
export function applyDocumentBinarization(
  src: ImageData,
  blockSize: number = 21,
  cConstant: number = 10
): ImageData {
  return applyAdaptiveThreshold(src, blockSize, cConstant);
}

/**
 * Document Clean Enhancement (Boost contrast, sharpen text, soften paper background)
 */
export function applyDocumentEnhance(
  src: ImageData,
  mode: "color" | "grayscale" | "bw" = "color"
): ImageData {
  if (mode === "bw") {
    return applyDocumentBinarization(src);
  }

  let result = applyContrast(src, 30);
  result = applySharpening(result, 1.2);

  if (mode === "grayscale") {
    const data = result.data;
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.round(getLuminance(data[i], data[i + 1], data[i + 2]));
      // High-key paper whitener
      const boosted = lum > 170 ? Math.min(255, lum + 35) : lum;
      data[i] = boosted;
      data[i + 1] = boosted;
      data[i + 2] = boosted;
    }
  } else if (mode === "color") {
    // Lift light paper pixels to clean white while preserving ink saturation
    const data = result.data;
    for (let i = 0; i < data.length; i += 4) {
      const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
      if (lum > 200) {
        data[i] = Math.min(255, Math.round(data[i] * 1.1));
        data[i + 1] = Math.min(255, Math.round(data[i + 1] * 1.1));
        data[i + 2] = Math.min(255, Math.round(data[i + 2] * 1.1));
      }
    }
  }

  return result;
}
