import { clamp, cloneImageData, getLuminance, rgbToHsv, hsvToRgb } from "./core";

/**
 * Brightness Adjustment: Pixel Intensity Addition
 */
export function applyBrightness(src: ImageData, amount: number): ImageData {
  const output = cloneImageData(src);
  const data = output.data;
  // amount typically -100 to +100. Scale to -255..+255
  const delta = (amount / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + delta);
    data[i + 1] = clamp(data[i + 1] + delta);
    data[i + 2] = clamp(data[i + 2] + delta);
  }
  return output;
}

/**
 * Contrast Adjustment
 */
export function applyContrast(src: ImageData, amount: number): ImageData {
  const output = cloneImageData(src);
  const data = output.data;
  // amount -100 to 100. factor:
  const factor = (259 * (amount + 255)) / (255 * (259 - amount));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
  }
  return output;
}

/**
 * Grayscale Conversion
 */
export function applyGrayscale(src: ImageData): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const lum = clamp(getLuminance(data[i], data[i + 1], data[i + 2]));
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }
  return output;
}

/**
 * Negative / Inversion
 */
export function applyNegative(src: ImageData): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return output;
}

/**
 * Sepia Matrix Transformation
 */
export function applySepia(src: ImageData): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = clamp(r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
  }
  return output;
}

/**
 * Gamma Correction (Power-law transformation)
 */
export function applyGamma(src: ImageData, gamma: number): ImageData {
  const output = cloneImageData(src);
  const data = output.data;
  const safeGamma = Math.max(0.05, gamma);
  const invGamma = 1 / safeGamma;

  // Pre-calculate lookup table
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = clamp(Math.pow(i / 255, invGamma) * 255);
  }

  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
  return output;
}

/**
 * Global Binary Thresholding
 */
export function applyGlobalThreshold(src: ImageData, threshold: number): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
    const val = lum >= threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  return output;
}

/**
 * Adaptive Thresholding (Local window mean comparison)
 */
export function applyAdaptiveThreshold(
  src: ImageData,
  blockSize: number = 15,
  cConstant: number = 7
): ImageData {
  const width = src.width;
  const height = src.height;
  const output = cloneImageData(src);
  const data = output.data;
  const gray = new Uint8Array(width * height);

  for (let i = 0, j = 0; i < src.data.length; i += 4, j++) {
    gray[j] = Math.round(getLuminance(src.data[i], src.data[i + 1], src.data[i + 2]));
  }

  // Integral image for fast local box mean
  const integral = new Float64Array((width + 1) * (height + 1));
  const stride = width + 1;

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * stride + (x + 1)] =
        integral[y * stride + (x + 1)] + rowSum;
    }
  }

  const radius = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height, y + radius + 1);

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width, x + radius + 1);

      const count = (y1 - y0) * (x1 - x0);
      const sum =
        integral[y1 * stride + x1] -
        integral[y0 * stride + x1] -
        integral[y1 * stride + x0] +
        integral[y0 * stride + x0];

      const mean = sum / count;
      const pixelVal = gray[y * width + x];
      const binaryVal = pixelVal >= mean - cConstant ? 255 : 0;

      const idx = (y * width + x) * 4;
      data[idx] = binaryVal;
      data[idx + 1] = binaryVal;
      data[idx + 2] = binaryVal;
    }
  }

  return output;
}

/**
 * Histogram Equalization (Equalizes cumulative distribution function of luminance)
 */
export function applyHistogramEqualization(src: ImageData): ImageData {
  const output = cloneImageData(src);
  const data = output.data;
  const numPixels = src.width * src.height;

  // Calculate histogram for luminance
  const hist = new Int32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(getLuminance(data[i], data[i + 1], data[i + 2]));
    hist[lum]++;
  }

  // Calculate Cumulative Distribution Function (CDF)
  const cdf = new Float32Array(256);
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    cdf[i] = acc;
  }

  // Find min non-zero CDF
  let cdfMin = 0;
  for (let i = 0; i < 256; i++) {
    if (cdf[i] > 0) {
      cdfMin = cdf[i];
      break;
    }
  }

  // Build equalization lookup table
  const lut = new Uint8Array(256);
  const denom = numPixels - cdfMin || 1;
  for (let i = 0; i < 256; i++) {
    lut[i] = clamp(Math.round(((cdf[i] - cdfMin) / denom) * 255));
  }

  // Apply to RGB keeping chromaticity ratios
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(getLuminance(data[i], data[i + 1], data[i + 2]));
    const newLum = lut[lum];
    const ratio = lum > 0 ? newLum / lum : 1;

    data[i] = clamp(data[i] * ratio);
    data[i + 1] = clamp(data[i + 1] * ratio);
    data[i + 2] = clamp(data[i + 2] * ratio);
  }

  return output;
}

/**
 * CLAHE (Contrast-Limited Adaptive Histogram Equalization)
 */
export function applyCLAHE(
  src: ImageData,
  clipLimit: number = 2.0,
  gridSize: number = 8
): ImageData {
  const width = src.width;
  const height = src.height;
  const output = cloneImageData(src);
  const data = output.data;

  // Extract luminance
  const lum = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    lum[j] = Math.round(getLuminance(data[i], data[i + 1], data[i + 2]));
  }

  const tileW = Math.ceil(width / gridSize);
  const tileH = Math.ceil(height / gridSize);

  // Compute clipped histogram & CDF for each tile
  const tileLuts: Uint8Array[][] = [];
  for (let gy = 0; gy < gridSize; gy++) {
    tileLuts[gy] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      const xStart = gx * tileW;
      const xEnd = Math.min(width, (gx + 1) * tileW);
      const yStart = gy * tileH;
      const yEnd = Math.min(height, (gy + 1) * tileH);
      const totalPixels = (xEnd - xStart) * (yEnd - yStart);

      const hist = new Int32Array(256);
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          hist[lum[y * width + x]]++;
        }
      }

      // Clip histogram
      const clipVal = Math.max(1, Math.round((clipLimit * totalPixels) / 256));
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipVal) {
          excess += hist[i] - clipVal;
          hist[i] = clipVal;
        }
      }
      const bonus = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        hist[i] += bonus;
      }

      // Cumulative CDF to LUT
      let sum = 0;
      const lut = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        sum += hist[i];
        lut[i] = clamp(Math.round((sum / totalPixels) * 255));
      }
      tileLuts[gy][gx] = lut;
    }
  }

  // Bilinear interpolation between tile LUTs
  for (let y = 0; y < height; y++) {
    const gyFloat = (y - tileH / 2) / tileH;
    const gy0 = Math.max(0, Math.min(gridSize - 1, Math.floor(gyFloat)));
    const gy1 = Math.max(0, Math.min(gridSize - 1, gy0 + 1));
    const yWeight = Math.max(0, Math.min(1, gyFloat - gy0));

    for (let x = 0; x < width; x++) {
      const gxFloat = (x - tileW / 2) / tileW;
      const gx0 = Math.max(0, Math.min(gridSize - 1, Math.floor(gxFloat)));
      const gx1 = Math.max(0, Math.min(gridSize - 1, gx0 + 1));
      const xWeight = Math.max(0, Math.min(1, gxFloat - gx0));

      const v = lum[y * width + x];
      const l00 = tileLuts[gy0][gx0][v];
      const l10 = tileLuts[gy0][gx1][v];
      const l01 = tileLuts[gy1][gx0][v];
      const l11 = tileLuts[gy1][gx1][v];

      const top = l00 * (1 - xWeight) + l10 * xWeight;
      const bottom = l01 * (1 - xWeight) + l11 * xWeight;
      const newLum = top * (1 - yWeight) + bottom * yWeight;

      const idx = (y * width + x) * 4;
      const ratio = v > 0 ? newLum / v : 1;
      data[idx] = clamp(data[idx] * ratio);
      data[idx + 1] = clamp(data[idx + 1] * ratio);
      data[idx + 2] = clamp(data[idx + 2] * ratio);
    }
  }

  return output;
}

/**
 * RGB Channel Separation
 */
export function applyRgbChannelSeparation(
  src: ImageData,
  channel: "red" | "green" | "blue"
): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    if (channel === "red") {
      data[i + 1] = 0;
      data[i + 2] = 0;
    } else if (channel === "green") {
      data[i] = 0;
      data[i + 2] = 0;
    } else if (channel === "blue") {
      data[i] = 0;
      data[i + 1] = 0;
    }
  }
  return output;
}

/**
 * HSV Transformation (Hue shift, Saturation multiplier, Value multiplier)
 */
export function applyHsvAdjustment(
  src: ImageData,
  hueShift: number = 0, // -180 to +180
  saturationFactor: number = 1.0, // 0.0 to 2.0
  valueFactor: number = 1.0 // 0.0 to 2.0
): ImageData {
  const output = cloneImageData(src);
  const data = output.data;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    const newH = (h + hueShift + 360) % 360;
    const newS = Math.min(100, Math.max(0, s * saturationFactor));
    const newV = Math.min(100, Math.max(0, v * valueFactor));

    const [r, g, b] = hsvToRgb(newH, newS, newV);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return output;
}
