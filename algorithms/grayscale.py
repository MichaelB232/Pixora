"""Algoritma 1: Grayscale (Konversi Citra Berwarna ke Skala Keabuan).

Mengubah citra 3 kanal (BGR) menjadi 1 kanal intensitas keabuan (0-255)
secara manual menggunakan bobot kontribusi warna tanpa fungsi cv2.cvtColor.
"""
from __future__ import annotations

import numpy as np


def apply_grayscale(img: np.ndarray, conversion: str = "Luminosity (BT.601)") -> np.ndarray:
    """Konversi citra BGR uint8 menjadi citra grayscale 1-kanal uint8.

    Metode yang didukung:
      - Luminosity (BT.601) : Y = 0.299*R + 0.587*G + 0.114*B
      - Luminosity (BT.709) : Y = 0.2126*R + 0.7152*G + 0.0722*B
      - Average             : Y = (R + G + B) / 3
      - Lightness           : Y = (max(R, G, B) + min(R, G, B)) / 2
    """
    if img.ndim == 2:
        return img.copy()

    # Langkah 1: Konversi ke float32 agar perhitungan perkalian/penjumlahan presisi
    f = img.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]

    # Langkah 2: Hitung intensitas keabuan sesuai rumus metode terpilih
    if conversion == "Luminosity (BT.601)":
        out = 0.299 * r + 0.587 * g + 0.114 * b
    elif conversion == "Luminosity (BT.709)":
        out = 0.2126 * r + 0.7152 * g + 0.0722 * b
    elif conversion == "Average":
        out = (r + g + b) / 3.0
    else:  # Lightness
        out = (f.max(axis=2) + f.min(axis=2)) / 2.0

    # Langkah 3: Pembulatan dan batasi rentang nilai ke [0, 255] sebagai uint8
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)
