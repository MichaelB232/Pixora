"""Algoritma 5: Histogram Equalization (Pemerataan Histogram).

Meningkatkan kontras citra secara otomatis dengan meratakan distribusi
intensitas piksel menggunakan Cumulative Distribution Function (CDF):
    s_k = round( (cdf(k) - cdf_min) / (N - cdf_min) * 255 )
"""
from __future__ import annotations

import numpy as np

from .utils import to_gray_float


def _equalize_channel(channel: np.ndarray) -> np.ndarray:
    """Ratakan histogram satu kanal uint8 [0..255] menggunakan CDF manual."""
    # Langkah 1: Hitung frekuensi (histogram) tiap level intensitas 0..255
    hist = np.bincount(channel.ravel(), minlength=256)

    # Langkah 2: Hitung distribusi kumulatif (CDF)
    cdf = hist.cumsum()
    total_pixels = int(cdf[-1])
    if total_pixels == 0:
        return channel.copy()

    # Langkah 3: Cari nilai CDF non-nol terkecil (cdf_min)
    nonzero = cdf[cdf > 0]
    if nonzero.size == 0:
        return channel.copy()
    cdf_min = int(nonzero[0])

    denom = total_pixels - cdf_min
    if denom <= 0:
        # Gambar seragam (hanya 1 nilai intensitas), tidak dapat diratakan lagi
        return channel.copy()

    # Langkah 4: Normalisasi CDF menjadi Look-Up Table (LUT) pemetaan 0..255
    lut = np.round((cdf - cdf_min) / float(denom) * 255.0).clip(0, 255).astype(np.uint8)

    # Langkah 5: Petakan setiap intensitas piksel melalui LUT
    return lut[channel]


def apply_equalization(img: np.ndarray, mode: str = "Luminance (color)") -> np.ndarray:
    """Terapkan Histogram Equalization secara manual tanpa cv2.equalizeHist.

    Mode:
      - "Grayscale"         : konversi ke grayscale lalu ratakan histogramnya.
      - "Luminance (color)" : konversi BGR -> YCbCr secara matematis, ratakan hanya
                              kanal Y (luminansi) agar rona warna asli tetap terjaga,
                              lalu konversi kembali YCbCr -> BGR.
    """
    if mode == "Grayscale" or img.ndim == 2:
        gray = np.clip(to_gray_float(img) + 0.5, 0, 255).astype(np.uint8)
        return _equalize_channel(gray)

    # Konversi manual BGR -> YCbCr (standar ITU-R BT.601 full-range)
    f = img.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]

    y = 0.299 * r + 0.587 * g + 0.114 * b
    cb = 128.0 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128.0 + 0.5 * r - 0.418688 * g - 0.081312 * b

    # Equalize hanya kanal luminansi (Y)
    y_u8 = np.clip(y + 0.5, 0, 255).astype(np.uint8)
    y_eq = _equalize_channel(y_u8).astype(np.float32)

    # Konversi kembali YCbCr -> BGR
    cb_shift = cb - 128.0
    cr_shift = cr - 128.0
    r_out = y_eq + 1.402 * cr_shift
    g_out = y_eq - 0.344136 * cb_shift - 0.714136 * cr_shift
    b_out = y_eq + 1.772 * cb_shift

    merged = np.stack([b_out, g_out, r_out], axis=-1)
    return np.clip(merged + 0.5, 0, 255).astype(np.uint8)
