"""Algoritma 9: Adaptive Threshold (Pengambangan Lokal Adaptif).

Menghitung nilai ambang T(x, y) secara dinamis untuk setiap piksel
berdasarkan rata-rata (Mean atau Gaussian) jendela tetangga B x B:
    T(x, y) = local_mean(x, y) - C
    out(x, y) = 255 jika gray(x, y) > T(x, y), selain itu 0
"""
from __future__ import annotations

import numpy as np

from .utils import convolve_separable, gaussian_kernel_1d, to_gray_float


def apply_adaptive_threshold(
    img: np.ndarray,
    block_size: int = 11,
    c: int = 2,
    method: str = "Gaussian",
) -> np.ndarray:
    """Binerisasi adaptif untuk pencahayaan tidak merata tanpa cv2.adaptiveThreshold."""
    # Pastikan block_size ganjil dan minimal 3
    if block_size < 3:
        block_size = 3
    if block_size % 2 == 0:
        block_size += 1

    # Langkah 1: Konversi citra ke grayscale 8-bit
    gray = np.clip(to_gray_float(img) + 0.5, 0, 255).astype(np.uint8)

    # Langkah 2: Hitung rata-rata lokal dalam area block_size x block_size
    if method == "Mean":
        k1d = np.full(block_size, 1.0 / block_size, dtype=np.float32)
    else:  # Gaussian
        k1d = gaussian_kernel_1d(block_size, sigma=0.0)

    local_mean = convolve_separable(gray, k1d)

    # Langkah 3: Tentukan ambang lokal T(x, y) = local_mean - C
    local_threshold = local_mean - float(c)

    # Langkah 4: Binerisasi piksel berdasarkan ambang lokalnya masing-masing
    return np.where(gray.astype(np.float32) > local_threshold, 255, 0).astype(np.uint8)
