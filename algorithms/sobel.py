"""Algoritma 3: Edge Detection (Operator Gradien Sobel).

Mendeteksi tepi objek melalui konvolusi spasial dengan sepasang kernel
turunan orde pertama Sobel arah horizontal (Gx) dan vertikal (Gy):
    |G| = sqrt(Gx^2 + Gy^2)
"""
from __future__ import annotations

import numpy as np

from .utils import convolve2d, normalize_u8, to_gray_float


def _sobel_kernels(ksize: int) -> tuple[np.ndarray, np.ndarray]:
    """Bangun sepasang kernel Sobel (Kx, Ky) ukuran 3x3, 5x5, atau 7x7 secara eksplisit."""
    if ksize == 3:
        # Kernel klasik Sobel 3x3 = outer_product([1, 2, 1], [-1, 0, 1])
        kx = np.array(
            [
                [-1, 0, 1],
                [-2, 0, 2],
                [-1, 0, 1],
            ],
            dtype=np.float32,
        )
        ky = np.array(
            [
                [-1, -2, -1],
                [0, 0, 0],
                [1, 2, 1],
            ],
            dtype=np.float32,
        )
        return kx, ky

    if ksize == 1:
        kx = np.array([[-1, 0, 1]], dtype=np.float32)
        ky = np.array([[-1], [0], [1]], dtype=np.float32)
        return kx, ky

    # Untuk ksize >= 5 (5x5, 7x7): koefisien smoothing Pascal dikombinasikan dengan turunan
    smooth = np.array([1.0], dtype=np.float32)
    for _ in range(ksize - 1):
        smooth = np.convolve(smooth, np.array([1.0, 1.0], dtype=np.float32))

    # Vektor turunan = smoothing ukuran (ksize - 2) dikonvolusikan dengan [-1, 0, 1]
    prev_smooth = np.array([1.0], dtype=np.float32)
    for _ in range(ksize - 3):
        prev_smooth = np.convolve(prev_smooth, np.array([1.0, 1.0], dtype=np.float32))
    diff = np.convolve(prev_smooth, np.array([-1.0, 0.0, 1.0], dtype=np.float32))

    kx = np.outer(smooth, diff).astype(np.float32)
    ky = np.outer(diff, smooth).astype(np.float32)
    return kx, ky


def apply_sobel(img: np.ndarray, ksize: str = "3", direction: str = "Both") -> np.ndarray:
    """Deteksi tepi menggunakan operator Sobel manual tanpa cv2.Sobel.

    Langkah:
      1. Konversi citra ke grayscale (luminansi BT.601).
      2. Konvolusi citra dengan kernel Kx (tepi vertikal) dan Ky (tepi horizontal).
      3. Hitung magnitudo gradien sesuai arah: |Gx|, |Gy|, atau sqrt(Gx^2 + Gy^2).
      4. Normalisasi hasil ke rentang uint8 [0, 255].
    """
    # Langkah 1: Konversi ke grayscale float32
    gray = to_gray_float(img)

    # Langkah 2: Siapkan kernel Sobel Kx dan Ky
    kx, ky = _sobel_kernels(int(ksize))

    # Langkah 3: Hitung gradien sesuai arah yang dipilih
    if direction.startswith("X"):
        grad = np.abs(convolve2d(gray, kx))
    elif direction.startswith("Y"):
        grad = np.abs(convolve2d(gray, ky))
    else:
        gx = convolve2d(gray, kx)
        gy = convolve2d(gray, ky)
        grad = np.hypot(gx, gy)  # sqrt(gx^2 + gy^2)

    # Langkah 4: Normalisasi min-max ke rentang [0, 255]
    return normalize_u8(grad)
