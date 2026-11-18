"""Algoritma Biasa: Contrast (Peregangan Kontras Linear).

Mengubah rentang perbedaan terang dan gelap citra dengan meregangkan
atau menyempitkan intensitas piksel terhadap titik tengah 128:
    s = clip((r - 128) * (pct / 100) + 128, 0, 255)
"""
from __future__ import annotations

import numpy as np


def apply_contrast(img: np.ndarray, value: int = 100) -> np.ndarray:
    """Atur kontras citra secara linear terhadap nilai tengah 128.

    Parameter:
      - value : Persentase kontras (0% = abu-abu datar 128, 100% = normal, >100% = kontras lebih tinggi).
    """
    # Langkah 1: Konversi persentase ke faktor pengali (100% -> 1.0)
    factor = float(value) / 100.0

    # Langkah 2: Geser titik tengah ke 0 (-128), kalikan faktor, lalu kembalikan ke +128
    stretched = (img.astype(np.float32) - 128.0) * factor + 128.0

    # Langkah 3: Batasi rentang [0, 255] dan kembalikan sebagai uint8
    return np.clip(stretched + 0.5, 0, 255).astype(np.uint8)
