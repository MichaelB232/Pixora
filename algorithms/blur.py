"""Algoritma 4: Blur / Smoothing (Gaussian Blur & Mean Filter).

Menghaluskan citra dan meredam noise dengan konvolusi kernel bobot
Gaussian atau rata-rata seragam (Mean/Box) secara manual.
"""
from __future__ import annotations

import numpy as np

from .utils import convolve_separable, gaussian_kernel_1d


def apply_blur(
    img: np.ndarray,
    method: str = "Gaussian",
    ksize: int = 5,
    sigma: float = 0.0,
) -> np.ndarray:
    """Haluskan gambar menggunakan Gaussian Blur atau Mean Blur secara manual.

    Parameter:
      - method : "Gaussian" (bobot kurva normal) atau "Mean (Box)" (bobot seragam 1/k)
      - ksize  : Ukuran jendela konvolusi (ganjil, misal 3, 5, 7, ...)
      - sigma  : Simpangan baku Gaussian (0 = dihitung otomatis dari ksize)
    """
    if ksize <= 1:
        return img.copy()

    if ksize % 2 == 0:
        ksize += 1

    # Langkah 1: Bangun kernel 1D separable sesuai metode blur
    if method == "Mean (Box)":
        # Bobot seragam: setiap piksel dalam jendela k x k berkontribusi 1/k^2
        k1d = np.full(ksize, 1.0 / ksize, dtype=np.float32)
    else:
        # Bobot Gaussian: piksel dekat pusat diberi bobot lebih besar
        k1d = gaussian_kernel_1d(ksize, sigma)

    # Langkah 2: Terapkan konvolusi separable (pass horizontal + pass vertikal)
    blurred = convolve_separable(img, k1d)

    # Langkah 3: Pembulatan & clamping ke [0, 255] uint8
    return np.clip(blurred + 0.5, 0, 255).astype(np.uint8)
