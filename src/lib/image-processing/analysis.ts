import { getLuminance } from "./core";
import { HistogramData, ImageStatistics, ImageMetadata } from "./types";

/**
 * Compute 256-bin histograms for R, G, B, and Luminance
 */
export function calculateHistogram(src: ImageData): HistogramData {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const luminance = new Array(256).fill(0);

  const data = src.data;
  let maxCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const lum = Math.round(getLuminance(red, green, blue));

    r[red]++;
    g[green]++;
    b[blue]++;
    luminance[lum]++;
  }

  for (let i = 0; i < 256; i++) {
    if (r[i] > maxCount) maxCount = r[i];
    if (g[i] > maxCount) maxCount = g[i];
    if (b[i] > maxCount) maxCount = b[i];
    if (luminance[i] > maxCount) maxCount = luminance[i];
  }

  return { r, g, b, luminance, maxCount };
}

/**
 * Compute statistical metrics for an image
 */
export function calculateStatistics(src: ImageData): ImageStatistics {
  const data = src.data;
  const numPixels = src.width * src.height;

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    lSum = 0;
  let rMin = 255,
    gMin = 255,
    bMin = 255,
    lMin = 255;
  let rMax = 0,
    gMax = 0,
    bMax = 0,
    lMax = 0;

  const rHist = new Uint32Array(256);
  const gHist = new Uint32Array(256);
  const bHist = new Uint32Array(256);
  const lHist = new Uint32Array(256);

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const lum = Math.round(getLuminance(red, green, blue));

    rSum += red;
    gSum += green;
    bSum += blue;
    lSum += lum;

    if (red < rMin) rMin = red;
    if (red > rMax) rMax = red;

    if (green < gMin) gMin = green;
    if (green > gMax) gMax = green;

    if (blue < bMin) bMin = blue;
    if (blue > bMax) bMax = blue;

    if (lum < lMin) lMin = lum;
    if (lum > lMax) lMax = lum;

    rHist[red]++;
    gHist[green]++;
    bHist[blue]++;
    lHist[lum]++;
  }

  const rMean = rSum / numPixels;
  const gMean = gSum / numPixels;
  const bMean = bSum / numPixels;
  const lMean = lSum / numPixels;

  // Compute variance & StdDev
  let rVar = 0,
    gVar = 0,
    bVar = 0,
    lVar = 0;
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const lum = Math.round(getLuminance(red, green, blue));

    rVar += (red - rMean) * (red - rMean);
    gVar += (green - gMean) * (green - gMean);
    bVar += (blue - bMean) * (blue - bMean);
    lVar += (lum - lMean) * (lum - lMean);
  }

  // Find median from histogram
  const half = Math.floor(numPixels / 2);
  const findMedian = (hist: Uint32Array) => {
    let acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      if (acc >= half) return i;
    }
    return 128;
  };

  return {
    mean: {
      r: Math.round(rMean * 10) / 10,
      g: Math.round(gMean * 10) / 10,
      b: Math.round(bMean * 10) / 10,
      l: Math.round(lMean * 10) / 10,
    },
    stdDev: {
      r: Math.round(Math.sqrt(rVar / numPixels) * 10) / 10,
      g: Math.round(Math.sqrt(gVar / numPixels) * 10) / 10,
      b: Math.round(Math.sqrt(bVar / numPixels) * 10) / 10,
      l: Math.round(Math.sqrt(lVar / numPixels) * 10) / 10,
    },
    min: { r: rMin, g: gMin, b: bMin, l: lMin },
    max: { r: rMax, g: gMax, b: bMax, l: lMax },
    median: {
      r: findMedian(rHist),
      g: findMedian(gHist),
      b: findMedian(bHist),
      l: findMedian(lHist),
    },
  };
}

/**
 * Format GCD aspect ratio (e.g. 4:3, 16:9)
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const w = width / d;
  const h = height / d;
  if ((w === 4 && h === 3) || (w === 16 && h === 9) || (w === 3 && h === 2) || (w === 1 && h === 1)) {
    return `${w}:${h}`;
  }
  return `${(width / height).toFixed(2)}:1`;
}
