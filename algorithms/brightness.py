"""Algoritma 6: Brightness (Penyesuaian Kecerahan Linear).

Operasi titik (point operation) yang menggeser intensitas seluruh piksel
dengan konstanta beta:
    s = clip(r + beta, 0, 255)
"""
from __future__ import annotations

import numpy as np


def apply_brightness(img: np.ndarray, value: int = 0) -> np.ndarray:
    """Tambah atau kurangi kecerahan citra sebesar `value` (-100 s/d +100)."""
    # Langkah 1: Cast ke float32 agar penjumlahan tidak mengalami uint8 wrap-around
    shifted = img.astype(np.float32) + float(value)

    # Langkah 2: Potong nilai di luar [0, 255] dan kembalikan ke uint8
    return np.clip(shifted + 0.5, 0, 255).astype(np.uint8)
