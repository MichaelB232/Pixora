"""Algoritma 7: Sharpening (Penajaman Detail Citra).

Mendukung dua metode klasik penajaman citra secara manual:
  1. Unsharp Mask    : out = img + k * (img - blur(img))
  2. Laplacian Kernel: konvolusi dengan kernel penajaman 3x3
                       [[0, -a, 0], [-a, 1 + 4a, -a], [0, -a, 0]]
"""
from __future__ import annotations

import numpy as np

from .utils import convolve2d, convolve_separable, gaussian_kernel_1d


def apply_sharpening(
    img: np.ndarray,
    method: str = "Unsharp Mask",
    strength: int = 100,
    radius: float = 1.5,
) -> np.ndarray:
    """Tajamkan tepi dan detail citra tanpa fungsi cv2.

    Parameter:
      - method   : "Unsharp Mask" atau "Laplacian Kernel"
      - strength : Kekuatan penajaman dalam persen (0 - 300%)
      - radius   : Radius Gaussian blur (sigma) khusus untuk metode Unsharp Mask
    """
    alpha = float(strength) / 100.0
    if alpha <= 0.0:
        return img.copy()

    img_f = img.astype(np.float32)

    if method == "Laplacian Kernel":
        # Kernel Laplacian sharpening 3x3:
        # Untuk strength=100% (alpha=1.0), kernel = [[0,-1,0], [-1,5,-1], [0,-1,0]]
        kernel = np.array(
            [
                [0.0, -alpha, 0.0],
                [-alpha, 1.0 + 4.0 * alpha, -alpha],
                [0.0, -alpha, 0.0],
            ],
            dtype=np.float32,
        )
        out = convolve2d(img_f, kernel)
    else:
        # Metode Unsharp Mask:
        # Langkah 1: Bangun versi blur menggunakan Gaussian manual dengan sigma = radius
        ksize = int(np.ceil(max(radius, 0.3) * 6.0)) | 1
        ksize = max(3, min(ksize, 31))
        k1d = gaussian_kernel_1d(ksize, sigma=radius)
        blurred = convolve_separable(img_f, k1d)

        # Langkah 2: Ekstrak detail frekuensi tinggi (selisih gambar asli & versi blur)
        high_freq_detail = img_f - blurred

        # Langkah 3: Tambahkan detail berbobot alpha kembali ke gambar asli
        out = img_f + alpha * high_freq_detail

    return np.clip(out + 0.5, 0, 255).astype(np.uint8)
