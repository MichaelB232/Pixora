import { clamp, cloneImageData, applyConvolution, getLuminance } from "./core";
import { applyGaussianBlur, applyBilateralFilter } from "./restoration";
import { applyGrayscale } from "./editor";

/**
 * Pencil Sketch: Grayscale + Invert + Blur + Color Dodge
 */
export function applyPencilSketch(src: ImageData, blurRadius: number = 7): ImageData {
  const gray = applyGrayscale(src);
  const width = src.width;
  const height = src.height;
  const grayData = gray.data;

  // Inverted grayscale
  const inverted = cloneImageData(gray);
  const invData = inverted.data;
  for (let i = 0; i < invData.length; i += 4) {
    invData[i] = 255 - grayData[i];
    invData[i + 1] = 255 - grayData[i + 1];
    invData[i + 2] = 255 - grayData[i + 2];
  }

  // Gaussian blur inverted
  const blurred = applyGaussianBlur(inverted, blurRadius * 2 + 1, blurRadius / 2);
  const blurData = blurred.data;

  // Color Dodge blend: (image / (255 - blur)) * 255
  const output = cloneImageData(gray);
  const outData = output.data;

  for (let i = 0; i < outData.length; i += 4) {
    const b = blurData[i];
    const val = b === 255 ? 255 : clamp((grayData[i] * 255) / (255 - b));
    outData[i] = val;
    outData[i + 1] = val;
    outData[i + 2] = val;
  }

  return output;
}

/**
 * Cartoon Effect: Bilateral smoothing + Edge outline overlay
 */
export function applyCartoonEffect(src: ImageData, edgeThreshold: number = 80): ImageData {
  const smoothed = applyBilateralFilter(src, 3, 20, 30);
  const smoothData = smoothed.data;
  const width = src.width;
  const height = src.height;

  // Edge detection with Laplacian
  const laplace = [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ];
  const edges = applyConvolution(applyGrayscale(src), laplace);
  const edgeData = edges.data;

  const output = cloneImageData(smoothed);
  const outData = output.data;

  for (let i = 0; i < outData.length; i += 4) {
    const isEdge = edgeData[i] > edgeThreshold;
    if (isEdge) {
      outData[i] = 25;
      outData[i + 1] = 20;
      outData[i + 2] = 20;
    } else {
      // Slight posterization for cartoon look
      outData[i] = Math.floor(smoothData[i] / 32) * 32 + 16;
      outData[i + 1] = Math.floor(smoothData[i + 1] / 32) * 32 + 16;
      outData[i + 2] = Math.floor(smoothData[i + 2] / 32) * 32 + 16;
    }
  }

  return output;
}

/**
 * Emboss Convolution
 */
export function applyEmboss(src: ImageData, strength: number = 1.0): ImageData {
  const kernel = [
    [-2 * strength, -1 * strength, 0],
    [-1 * strength, 1, 1 * strength],
    [0, 1 * strength, 2 * strength],
  ];
  return applyConvolution(src, kernel, 1, 128);
}

/**
 * Pixel Art / Downsampling
 */
export function applyPixelArt(src: ImageData, pixelSize: number = 8, colors: number = 8): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const size = Math.max(2, Math.round(pixelSize));
  const step = 255 / (colors - 1);

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;

      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          rSum += srcData[idx];
          gSum += srcData[idx + 1];
          bSum += srcData[idx + 2];
          count++;
        }
      }

      // Quantize average colors
      const avgR = Math.round(Math.round(rSum / count / step) * step);
      const avgG = Math.round(Math.round(gSum / count / step) * step);
      const avgB = Math.round(Math.round(bSum / count / step) * step);

      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          outData[idx] = clamp(avgR);
          outData[idx + 1] = clamp(avgG);
          outData[idx + 2] = clamp(avgB);
        }
      }
    }
  }

  return output;
}

/**
 * Halftone (Dot pattern matrix simulation)
 */
export function applyHalftone(src: ImageData, dotSize: number = 6): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const size = Math.max(3, Math.round(dotSize));
  const radiusMax = size / 2;

  // Initialize output with warm paper background
  for (let i = 0; i < outData.length; i += 4) {
    outData[i] = 250;
    outData[i + 1] = 247;
    outData[i + 2] = 242;
  }

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      let lumSum = 0,
        count = 0;
      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          lumSum += getLuminance(srcData[idx], srcData[idx + 1], srcData[idx + 2]);
          count++;
        }
      }
      const avgLum = lumSum / count;
      // Darker pixels get larger dots
      const dotRadius = (1 - avgLum / 255) * radiusMax;
      const centerX = x + size / 2;
      const centerY = y + size / 2;

      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const dist = Math.hypot(x + dx - centerX, y + dy - centerY);
          if (dist <= dotRadius) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            outData[idx] = 45;
            outData[idx + 1] = 38;
            outData[idx + 2] = 35;
          }
        }
      }
    }
  }

  return output;
}

/**
 * Duotone: Two-Color Gradient Mapping (Default: Terracotta & Warm Paper)
 */
export function applyDuotone(
  src: ImageData,
  colorDark: [number, number, number] = [184, 83, 60], // Terracotta
  colorLight: [number, number, number] = [250, 245, 238] // Warm Cream
): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const t = getLuminance(data[i], data[i + 1], data[i + 2]) / 255;
    data[i] = clamp(colorDark[0] * (1 - t) + colorLight[0] * t);
    data[i + 1] = clamp(colorDark[1] * (1 - t) + colorLight[1] * t);
    data[i + 2] = clamp(colorDark[2] * (1 - t) + colorLight[2] * t);
  }

  return output;
}

/**
 * Vignette: Radial Intensity Decay
 */
export function applyVignette(
  src: ImageData,
  intensity: number = 0.5,
  radiusRatio: number = 0.75
): ImageData {
  const width = src.width;
  const height = src.height;
  const output = cloneImageData(src);
  const data = output.data;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.hypot(centerX, centerY) * radiusRatio;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.hypot(x - centerX, y - centerY);
      const factor = Math.max(0, 1 - Math.pow(dist / maxDist, 2) * intensity);

      const idx = (y * width + x) * 4;
      data[idx] = clamp(data[idx] * factor);
      data[idx + 1] = clamp(data[idx + 1] * factor);
      data[idx + 2] = clamp(data[idx + 2] * factor);
    }
  }

  return output;
}

/**
 * Motion Blur (Linear horizontal or directional convolution)
 */
export function applyMotionBlur(src: ImageData, length: number = 9): ImageData {
  const l = Math.max(3, Math.round(length));
  const row: number[] = new Array(l).fill(1 / l);
  const kernel = [row];
  return applyConvolution(src, kernel, 1);
}

/**
 * Glitch Effect: RGB Channel Displacement + Scanlines
 */
export function applyGlitch(
  src: ImageData,
  shiftAmount: number = 10,
  scanlineIntensity: number = 0.15
): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const data = output.data;

  const shift = Math.round(shiftAmount);

  for (let y = 0; y < height; y++) {
    const isScanline = y % 4 === 0;
    const scanFactor = isScanline ? 1 - scanlineIntensity : 1;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const rX = Math.min(width - 1, Math.max(0, x + shift));
      const bX = Math.min(width - 1, Math.max(0, x - shift));

      const rIdx = (y * width + rX) * 4;
      const bIdx = (y * width + bX) * 4;

      data[idx] = clamp(srcData[rIdx] * scanFactor);
      data[idx + 1] = clamp(srcData[idx + 1] * scanFactor);
      data[idx + 2] = clamp(srcData[bIdx + 2] * scanFactor);
    }
  }

  return output;
}

/**
 * Posterization: Color Quantization into discrete levels
 */
export function applyPosterization(src: ImageData, levels: number = 4): ImageData {
  const output = cloneImageData(src);
  const data = output.data;
  const numLevels = Math.max(2, Math.min(16, Math.round(levels)));
  const step = 255 / (numLevels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(Math.round(Math.round(data[i] / step) * step));
    data[i + 1] = clamp(Math.round(Math.round(data[i + 1] / step) * step));
    data[i + 2] = clamp(Math.round(Math.round(data[i + 2] / step) * step));
  }

  return output;
}
