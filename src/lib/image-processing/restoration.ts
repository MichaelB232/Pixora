import { clamp, cloneImageData, applyConvolution, getLuminance } from "./core";

/**
 * Generate 2D Gaussian Kernel
 */
function createGaussianKernel(size: number, sigma: number): { kernel: number[][]; sum: number } {
  const k = Math.max(3, size % 2 === 0 ? size + 1 : size);
  const half = Math.floor(k / 2);
  const s = sigma > 0 ? sigma : 0.3 * ((k - 1) * 0.5 - 1) + 0.8;
  const s2 = 2 * s * s;

  const kernel: number[][] = [];
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    const row: number[] = [];
    for (let x = -half; x <= half; x++) {
      const val = Math.exp(-(x * x + y * y) / s2);
      row.push(val);
      sum += val;
    }
    kernel.push(row);
  }

  return { kernel, sum };
}

/**
 * Gaussian Blur
 */
export function applyGaussianBlur(
  src: ImageData,
  kernelSize: number = 5,
  sigma: number = 1.5
): ImageData {
  const { kernel, sum } = createGaussianKernel(kernelSize, sigma);
  return applyConvolution(src, kernel, sum);
}

/**
 * Median Filter (great for removing Salt & Pepper noise)
 */
export function applyMedianFilter(src: ImageData, radius: number = 1): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const r = Math.max(1, Math.min(4, Math.floor(radius)));
  const windowSize = (2 * r + 1) * (2 * r + 1);
  const midIndex = Math.floor(windowSize / 2);

  const rList = new Uint8Array(windowSize);
  const gList = new Uint8Array(windowSize);
  const bList = new Uint8Array(windowSize);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const py = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -r; dx <= r; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const idx = (py * width + px) * 4;
          rList[count] = srcData[idx];
          gList[count] = srcData[idx + 1];
          bList[count] = srcData[idx + 2];
          count++;
        }
      }

      // Fast sort
      rList.subarray(0, count).sort();
      gList.subarray(0, count).sort();
      bList.subarray(0, count).sort();

      const outIdx = (y * width + x) * 4;
      outData[outIdx] = rList[midIndex];
      outData[outIdx + 1] = gList[midIndex];
      outData[outIdx + 2] = bList[midIndex];
    }
  }

  return output;
}

/**
 * Bilateral Filter: Edge-preserving smoothing
 */
export function applyBilateralFilter(
  src: ImageData,
  radius: number = 3,
  sigmaSpatial: number = 15,
  sigmaRange: number = 30
): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const r = Math.max(1, Math.min(5, Math.floor(radius)));
  const twoSpatial2 = 2 * sigmaSpatial * sigmaSpatial;
  const twoRange2 = 2 * sigmaRange * sigmaRange;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIdx = (y * width + x) * 4;
      const cR = srcData[centerIdx];
      const cG = srcData[centerIdx + 1];
      const cB = srcData[centerIdx + 2];

      let rSum = 0,
        gSum = 0,
        bSum = 0,
        wSum = 0;

      for (let dy = -r; dy <= r; dy++) {
        const py = Math.min(height - 1, Math.max(0, y + dy));
        const distSpatial2 = dy * dy;

        for (let dx = -r; dx <= r; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const idx = (py * width + px) * 4;
          const pR = srcData[idx];
          const pG = srcData[idx + 1];
          const pB = srcData[idx + 2];

          const dDist = distSpatial2 + dx * dx;
          const dColor =
            (pR - cR) * (pR - cR) + (pG - cG) * (pG - cG) + (pB - cB) * (pB - cB);

          const weight = Math.exp(-dDist / twoSpatial2 - dColor / twoRange2);
          rSum += pR * weight;
          gSum += pG * weight;
          bSum += pB * weight;
          wSum += weight;
        }
      }

      outData[centerIdx] = clamp(rSum / wSum);
      outData[centerIdx + 1] = clamp(gSum / wSum);
      outData[centerIdx + 2] = clamp(bSum / wSum);
    }
  }

  return output;
}

/**
 * Image Sharpening: Laplacian Kernel
 */
export function applySharpening(src: ImageData, strength: number = 1.0): ImageData {
  // Laplacian high pass:
  // [  0, -1,  0 ]
  // [ -1, 4+k, -1 ]
  // [  0, -1,  0 ]
  const k = Math.max(0.2, strength);
  const kernel = [
    [0, -k, 0],
    [-k, 4 * k + 1, -k],
    [0, -k, 0],
  ];
  return applyConvolution(src, kernel, 1);
}

/**
 * Unsharp Masking: High-frequency boost
 */
export function applyUnsharpMask(
  src: ImageData,
  amount: number = 1.5,
  radius: number = 3
): ImageData {
  const blurred = applyGaussianBlur(src, radius * 2 + 1, radius);
  const output = cloneImageData(src);
  const outData = output.data;
  const srcData = src.data;
  const blurData = blurred.data;

  for (let i = 0; i < srcData.length; i += 4) {
    outData[i] = clamp(srcData[i] + amount * (srcData[i] - blurData[i]));
    outData[i + 1] = clamp(srcData[i + 1] + amount * (srcData[i + 1] - blurData[i + 1]));
    outData[i + 2] = clamp(srcData[i + 2] + amount * (srcData[i + 2] - blurData[i + 2]));
  }
  return output;
}

/**
 * Motion Deblur (Directional deconvolution approximation)
 */
export function applyMotionDeblur(
  src: ImageData,
  length: number = 5,
  angle: number = 0
): ImageData {
  // Inverse filtering / high-pass compensation along angle
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  const l = Math.max(2, Math.min(15, Math.round(length)));
  const half = Math.floor(l / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;

      for (let s = -half; s <= half; s++) {
        if (s === 0) continue;
        const px = Math.min(width - 1, Math.max(0, Math.round(x + s * dx)));
        const py = Math.min(height - 1, Math.max(0, Math.round(y + s * dy)));
        const pIdx = (py * width + px) * 4;

        rSum += srcData[pIdx];
        gSum += srcData[pIdx + 1];
        bSum += srcData[pIdx + 2];
        count++;
      }

      const rBlur = rSum / (count || 1);
      const gBlur = gSum / (count || 1);
      const bBlur = bSum / (count || 1);

      // Unsharp along direction
      outData[idx] = clamp(srcData[idx] + 0.8 * (srcData[idx] - rBlur));
      outData[idx + 1] = clamp(srcData[idx + 1] + 0.8 * (srcData[idx + 1] - gBlur));
      outData[idx + 2] = clamp(srcData[idx + 2] + 0.8 * (srcData[idx + 2] - bBlur));
    }
  }

  return output;
}

/**
 * Scratch Reduction / Inpainting
 */
export function applyScratchReduction(
  src: ImageData,
  threshold: number = 30,
  radius: number = 2
): ImageData {
  const width = src.width;
  const height = src.height;
  const srcData = src.data;
  const output = cloneImageData(src);
  const outData = output.data;

  // Detect sharp high-contrast scratches by comparing with median
  const median = applyMedianFilter(src, radius);
  const medData = median.data;

  for (let i = 0; i < srcData.length; i += 4) {
    const diff = Math.abs(srcData[i] - medData[i]) +
                 Math.abs(srcData[i + 1] - medData[i + 1]) +
                 Math.abs(srcData[i + 2] - medData[i + 2]);

    // If pixel deviates significantly from local neighborhood, blend in median
    if (diff > threshold * 3) {
      outData[i] = medData[i];
      outData[i + 1] = medData[i + 1];
      outData[i + 2] = medData[i + 2];
    }
  }

  return output;
}
