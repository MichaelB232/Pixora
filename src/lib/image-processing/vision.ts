import { clamp, cloneImageData, applyConvolution, getLuminance, rgbToHsv } from "./core";
import { applyGaussianBlur } from "./restoration";
import { applyGrayscale } from "./editor";

/**
 * Sobel Operator: First-order derivative edge detection
 */
export function applySobel(src: ImageData): ImageData {
  const width = src.width;
  const height = src.height;
  const gray = applyGrayscale(src);
  const gData = gray.data;

  const output = cloneImageData(src);
  const outData = output.data;

  // Sobel X & Y kernels
  // Gx = [-1 0 1; -2 0 2; -1 0 1]
  // Gy = [-1 -2 -1; 0 0 0; 1 2 1]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p00 = gData[((y - 1) * width + (x - 1)) * 4];
      const p01 = gData[((y - 1) * width + x) * 4];
      const p02 = gData[((y - 1) * width + (x + 1)) * 4];

      const p10 = gData[(y * width + (x - 1)) * 4];
      const p12 = gData[(y * width + (x + 1)) * 4];

      const p20 = gData[((y + 1) * width + (x - 1)) * 4];
      const p21 = gData[((y + 1) * width + x) * 4];
      const p22 = gData[((y + 1) * width + (x + 1)) * 4];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const mag = clamp(Math.hypot(gx, gy));
      const idx = (y * width + x) * 4;
      outData[idx] = mag;
      outData[idx + 1] = mag;
      outData[idx + 2] = mag;
    }
  }

  return output;
}

/**
 * Prewitt Operator
 */
export function applyPrewitt(src: ImageData): ImageData {
  const width = src.width;
  const height = src.height;
  const gray = applyGrayscale(src);
  const gData = gray.data;

  const output = cloneImageData(src);
  const outData = output.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p00 = gData[((y - 1) * width + (x - 1)) * 4];
      const p01 = gData[((y - 1) * width + x) * 4];
      const p02 = gData[((y - 1) * width + (x + 1)) * 4];

      const p10 = gData[(y * width + (x - 1)) * 4];
      const p12 = gData[(y * width + (x + 1)) * 4];

      const p20 = gData[((y + 1) * width + (x - 1)) * 4];
      const p21 = gData[((y + 1) * width + x) * 4];
      const p22 = gData[((y + 1) * width + (x + 1)) * 4];

      const gx = -p00 + p02 - p10 + p12 - p20 + p22;
      const gy = -p00 - p01 - p02 + p20 + p21 + p22;

      const mag = clamp(Math.hypot(gx, gy));
      const idx = (y * width + x) * 4;
      outData[idx] = mag;
      outData[idx + 1] = mag;
      outData[idx + 2] = mag;
    }
  }

  return output;
}

/**
 * Laplacian Operator: Second-order derivative
 */
export function applyLaplacian(src: ImageData): ImageData {
  const kernel = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0],
  ];
  return applyConvolution(applyGrayscale(src), kernel, 1, 128);
}

/**
 * Canny Edge Detection:
 * Multi-stage: Gaussian smoothing -> Sobel gradient -> Non-max suppression -> Hysteresis
 */
export function applyCanny(
  src: ImageData,
  lowThreshold: number = 30,
  highThreshold: number = 70
): ImageData {
  const width = src.width;
  const height = src.height;

  // 1. Gaussian Blur
  const blurred = applyGaussianBlur(applyGrayscale(src), 5, 1.4);
  const bData = blurred.data;

  // 2. Sobel Gradients and Angles
  const magnitude = new Float32Array(width * height);
  const angle = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p00 = bData[((y - 1) * width + (x - 1)) * 4];
      const p01 = bData[((y - 1) * width + x) * 4];
      const p02 = bData[((y - 1) * width + (x + 1)) * 4];

      const p10 = bData[(y * width + (x - 1)) * 4];
      const p12 = bData[(y * width + (x + 1)) * 4];

      const p20 = bData[((y + 1) * width + (x - 1)) * 4];
      const p21 = bData[((y + 1) * width + x) * 4];
      const p22 = bData[((y + 1) * width + (x + 1)) * 4];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const idx = y * width + x;
      magnitude[idx] = Math.hypot(gx, gy);
      let theta = (Math.atan2(gy, gx) * 180) / Math.PI;
      if (theta < 0) theta += 180;
      angle[idx] = theta;
    }
  }

  // 3. Non-Maximum Suppression
  const nms = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const m = magnitude[idx];
      const a = angle[idx];

      let q = 255;
      let r = 255;

      // 0 degrees (horizontal)
      if ((a >= 0 && a < 22.5) || (a >= 157.5 && a <= 180)) {
        q = magnitude[y * width + (x + 1)];
        r = magnitude[y * width + (x - 1)];
      }
      // 45 degrees
      else if (a >= 22.5 && a < 67.5) {
        q = magnitude[(y + 1) * width + (x - 1)];
        r = magnitude[(y - 1) * width + (x + 1)];
      }
      // 90 degrees (vertical)
      else if (a >= 67.5 && a < 112.5) {
        q = magnitude[(y + 1) * width + x];
        r = magnitude[(y - 1) * width + x];
      }
      // 135 degrees
      else if (a >= 112.5 && a < 157.5) {
        q = magnitude[(y - 1) * width + (x - 1)];
        r = magnitude[(y + 1) * width + (x + 1)];
      }

      if (m >= q && m >= r) {
        nms[idx] = m;
      } else {
        nms[idx] = 0;
      }
    }
  }

  // 4. Double Threshold & Hysteresis
  const output = cloneImageData(src);
  const outData = output.data;
  const strong = 255;
  const weak = 100;
  const edgeState = new Uint8Array(width * height);

  for (let i = 0; i < nms.length; i++) {
    if (nms[i] >= highThreshold) {
      edgeState[i] = strong;
    } else if (nms[i] >= lowThreshold) {
      edgeState[i] = weak;
    } else {
      edgeState[i] = 0;
    }
  }

  // Hysteresis link weak edges to strong
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (edgeState[idx] === weak) {
        // Check 8-neighborhood for strong edge
        const hasStrongNeighbor =
          edgeState[(y - 1) * width + (x - 1)] === strong ||
          edgeState[(y - 1) * width + x] === strong ||
          edgeState[(y - 1) * width + (x + 1)] === strong ||
          edgeState[y * width + (x - 1)] === strong ||
          edgeState[y * width + (x + 1)] === strong ||
          edgeState[(y + 1) * width + (x - 1)] === strong ||
          edgeState[(y + 1) * width + x] === strong ||
          edgeState[(y + 1) * width + (x + 1)] === strong;

        edgeState[idx] = hasStrongNeighbor ? strong : 0;
      }

      const pIdx = idx * 4;
      const v = edgeState[idx] === strong ? 255 : 0;
      outData[pIdx] = v;
      outData[pIdx + 1] = v;
      outData[pIdx + 2] = v;
    }
  }

  return output;
}

/**
 * Morphological Erosion
 */
export function applyErosion(src: ImageData, radius: number = 1): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const r = Math.max(1, Math.min(4, Math.round(radius)));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minR = 255,
        minG = 255,
        minB = 255;

      for (let dy = -r; dy <= r; dy++) {
        const py = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -r; dx <= r; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const idx = (py * width + px) * 4;

          minR = Math.min(minR, srcData[idx]);
          minG = Math.min(minG, srcData[idx + 1]);
          minB = Math.min(minB, srcData[idx + 2]);
        }
      }

      const outIdx = (y * width + x) * 4;
      outData[outIdx] = minR;
      outData[outIdx + 1] = minG;
      outData[outIdx + 2] = minB;
    }
  }

  return output;
}

/**
 * Morphological Dilation
 */
export function applyDilation(src: ImageData, radius: number = 1): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const r = Math.max(1, Math.min(4, Math.round(radius)));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxR = 0,
        maxG = 0,
        maxB = 0;

      for (let dy = -r; dy <= r; dy++) {
        const py = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -r; dx <= r; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const idx = (py * width + px) * 4;

          maxR = Math.max(maxR, srcData[idx]);
          maxG = Math.max(maxG, srcData[idx + 1]);
          maxB = Math.max(maxB, srcData[idx + 2]);
        }
      }

      const outIdx = (y * width + x) * 4;
      outData[outIdx] = maxR;
      outData[outIdx + 1] = maxG;
      outData[outIdx + 2] = maxB;
    }
  }

  return output;
}

/**
 * Morphological Opening: Erosion then Dilation
 */
export function applyOpening(src: ImageData, radius: number = 1): ImageData {
  return applyDilation(applyErosion(src, radius), radius);
}

/**
 * Morphological Closing: Dilation then Erosion
 */
export function applyClosing(src: ImageData, radius: number = 1): ImageData {
  return applyErosion(applyDilation(src, radius), radius);
}

/**
 * Contour Detection and Highlighting
 */
export function applyContourDetection(src: ImageData, threshold: number = 50): ImageData {
  const edges = applySobel(src);
  const edgeData = edges.data;
  const output = cloneImageData(src);
  const outData = output.data;

  for (let i = 0; i < outData.length; i += 4) {
    if (edgeData[i] > threshold) {
      // Highlight contour with terracotta stroke
      outData[i] = 184; // R
      outData[i + 1] = 83; // G
      outData[i + 2] = 60; // B
    }
  }

  return output;
}

/**
 * Watershed Segmentation Preview (Marker-based color region map)
 */
export function applyWatershed(src: ImageData, numClusters: number = 6): ImageData {
  const width = src.width;
  const height = src.height;
  const output = cloneImageData(src);
  const data = output.data;

  // Harmonious terracotta and natural earth color palette for regions
  const palette = [
    [184, 83, 60],  // Terracotta
    [70, 101, 79],  // Sage green
    [219, 149, 114], // Peach
    [93, 84, 79],   // Deep warm stone
    [230, 209, 185], // Warm cream
    [130, 75, 55],  // Rust
    [120, 155, 130], // Light sage
    [245, 238, 227], // Off white
  ];

  const step = 256 / numClusters;

  for (let i = 0; i < data.length; i += 4) {
    const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
    const cluster = Math.min(palette.length - 1, Math.floor(lum / step));
    const color = palette[cluster % palette.length];

    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
  }

  return output;
}

/**
 * HSV Color Segmentation
 */
export function applyHsvColorSegmentation(
  src: ImageData,
  minHue: number = 0,
  maxHue: number = 60,
  minSat: number = 20,
  maxSat: number = 100
): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s] = rgbToHsv(data[i], data[i + 1], data[i + 2]);

    const hueMatch =
      minHue <= maxHue
        ? h >= minHue && h <= maxHue
        : h >= minHue || h <= maxHue; // wrap around 360

    const satMatch = s >= minSat && s <= maxSat;

    if (!hueMatch || !satMatch) {
      // Desaturate and darken unselected regions
      const lum = Math.round(getLuminance(data[i], data[i + 1], data[i + 2]) * 0.4);
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
    }
  }

  return output;
}
