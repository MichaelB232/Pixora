"""Algoritma 2: Image Negative (Inversi Intensitas Piksel).

Membalik intensitas terang dan gelap citra 8-bit dengan rumus:
    s = (L - 1) - r = 255 - r
di mana r adalah intensitas piksel input dan L = 256 level keabuan.
"""
from __future__ import annotations

import numpy as np


def apply_negative(img: np.ndarray) -> np.ndarray:
    """Membalik nilai setiap piksel terhadap nilai maksimum 255 secara manual."""
    # Langkah 1: Gunakan int16 untuk mencegah overflow/underflow saat pengurangan
    inverted = 255 - img.astype(np.int16)

    # Langkah 2: Batasi nilai ke [0, 255] dan kembalikan sebagai uint8
    return np.clip(inverted, 0, 255).astype(np.uint8)
