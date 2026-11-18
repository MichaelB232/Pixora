"""Algoritma Biasa: Gamma Correction (Transformasi Power-Law Non-Linear).

Memetakan intensitas piksel secara non-linear menggunakan Look-Up Table (LUT):
    s = 255 * (r / 255) ^ (1 / gamma)
Berguna untuk mencerahkan area gelap/mid-tone tanpa membuat area terang over-exposed.
"""
from __future__ import annotations

import numpy as np


def apply_gamma(img: np.ndarray, gamma: float = 1.0) -> np.ndarray:
    """Terapkan koreksi gamma non-linear menggunakan Look-Up Table 256 level."""
    g = max(float(gamma), 1e-3)
    inv_gamma = 1.0 / g

    # Langkah 1: Bangun Look-Up Table (LUT) untuk seluruh intensitas 0..255
    levels = np.arange(256, dtype=np.float32) / 255.0
    lut = np.clip((levels ** inv_gamma) * 255.0 + 0.5, 0, 255).astype(np.uint8)

    # Langkah 2: Petakan setiap piksel pada citra input lewat LUT
    return lut[img]
