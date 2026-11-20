"""Utilitas matematika dasar pengolahan citra (100% NumPy manual, tanpa cv2).

Menyediakan fungsi konversi grayscale, normalisasi min-max, pembangkit kernel
Gaussian 1D, serta operasi konvolusi 2D dan separable 1D secara eksplisit.
"""
from __future__ import annotations

import numpy as np


def to_gray_float(img: np.ndarray) -> np.ndarray:
    """Konversi citra BGR ke grayscale float32 menggunakan rumus ITU-R BT.601.

    Rumus: Y = 0.299 * R + 0.587 * G + 0.114 * B
    """
    if img.ndim == 2:
        return img.astype(np.float32)
    f = img.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    return 0.299 * r + 0.587 * g + 0.114 * b


def normalize_u8(arr: np.ndarray) -> np.ndarray:
    """Normalisasi min-max manual dari array float/int ke rentang uint8 [0, 255].

    Rumus: out = (arr - min) / (max - min) * 255
    """
    a = arr.astype(np.float32)
    lo = float(a.min())
    hi = float(a.max())
    if hi - lo < 1e-6:
        return np.zeros(a.shape, dtype=np.uint8)
    scaled = (a - lo) / (hi - lo) * 255.0
    return np.clip(scaled + 0.5, 0, 255).astype(np.uint8)


def gaussian_kernel_1d(ksize: int, sigma: float = 0.0) -> np.ndarray:
    """Bangun kernel Gaussian 1D ternormalisasi secara manual.

    Rumus: G(x) = exp(-x^2 / (2 * sigma^2)), lalu dibagi total bobot agar jumlah = 1.
    Jika sigma <= 0, dihitung otomatis: sigma = 0.3 * ((ksize - 1) * 0.5 - 1) + 0.8.
    """
    if ksize < 1:
        ksize = 1
    if ksize % 2 == 0:
        ksize += 1
    if sigma <= 0.0:
        sigma = 0.3 * ((ksize - 1) * 0.5 - 1.0) + 0.8
        sigma = max(sigma, 0.3)

    radius = ksize // 2
    x = np.arange(-radius, radius + 1, dtype=np.float32)
    kernel = np.exp(-(x ** 2) / (2.0 * sigma * sigma))
    return (kernel / kernel.sum()).astype(np.float32)


def convolve2d(img: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    """Konvolusi spasial 2D manual dengan edge padding (duplikasi piksel tepi).

    Mendukung citra 2D (grayscale) maupun 3D (BGR). Setiap piksel output adalah
    hasil penjumlahan terbobot dari jendela tetangga sebesar ukuran kernel.
    """
    kh, kw = kernel.shape
    pad_h, pad_w = kh // 2, kw // 2
    img_f = img.astype(np.float32)

    if img_f.ndim == 2:
        padded = np.pad(img_f, ((pad_h, pad_h), (pad_w, pad_w)), mode="edge")
    else:
        padded = np.pad(img_f, ((pad_h, pad_h), (pad_w, pad_w), (0, 0)), mode="edge")

    h, w = img_f.shape[:2]
    out = np.zeros_like(img_f, dtype=np.float32)

    for dy in range(kh):
        for dx in range(kw):
            weight = float(kernel[dy, dx])
            if weight != 0.0:
                out += weight * padded[dy : dy + h, dx : dx + w]

    return out


def convolve_separable(img: np.ndarray, k1d: np.ndarray) -> np.ndarray:
    """Konvolusi separable manual: pass horizontal (1D) diikuti pass vertikal (1D).

    Secara matematis ekuivalen dengan konvolusi 2D untuk kernel yang dapat dipisah
    (seperti Gaussian dan Mean),
    """
    ksize = len(k1d)
    pad = ksize // 2
    img_f = img.astype(np.float32)
    h, w = img_f.shape[:2]

    # 1. Pass horizontal
    if img_f.ndim == 2:
        pad_x = np.pad(img_f, ((0, 0), (pad, pad)), mode="edge")
    else:
        pad_x = np.pad(img_f, ((0, 0), (pad, pad), (0, 0)), mode="edge")

    horiz = np.zeros_like(img_f, dtype=np.float32)
    for dx in range(ksize):
        weight = float(k1d[dx])
        if weight != 0.0:
            horiz += weight * pad_x[:, dx : dx + w]

    # 2. Pass vertikal
    if horiz.ndim == 2:
        pad_y = np.pad(horiz, ((pad, pad), (0, 0)), mode="edge")
    else:
        pad_y = np.pad(horiz, ((pad, pad), (0, 0), (0, 0)), mode="edge")

    out = np.zeros_like(img_f, dtype=np.float32)
    for dy in range(ksize):
        weight = float(k1d[dy])
        if weight != 0.0:
            out += weight * pad_y[dy : dy + h, :]

    return out
