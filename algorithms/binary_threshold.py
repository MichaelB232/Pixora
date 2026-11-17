"""Algoritma 8: Binary Threshold (Pengambangan Global).

Mengubah citra keabuan menjadi citra biner atau terpotong berdasarkan
satu nilai ambang global T secara manual tanpa cv2.threshold.
"""
from __future__ import annotations

import numpy as np

from .utils import to_gray_float


def apply_binary_threshold(
    img: np.ndarray,
    threshold: int = 127,
    max_value: int = 255,
    thresh_type: str = "Binary",
) -> np.ndarray:
    """Terapkan global thresholding terhadap citra grayscale.

    Aturan untuk setiap piksel r = gray(x, y):
      - Binary           : max_value jika r > T, selain itu 0
      - Binary Inverted  : 0 jika r > T, selain itu max_value
      - Truncate         : T jika r > T, selain itu r
      - To Zero          : r jika r > T, selain itu 0
      - To Zero Inverted : 0 jika r > T, selain itu r
    """
    # Langkah 1: Konversi ke grayscale 8-bit secara manual
    gray = np.clip(to_gray_float(img) + 0.5, 0, 255).astype(np.uint8)
    mask = gray > threshold

    # Langkah 2: Evaluasi kondisi threshold per piksel
    if thresh_type == "Binary":
        out = np.where(mask, max_value, 0)
    elif thresh_type == "Binary Inverted":
        out = np.where(mask, 0, max_value)
    elif thresh_type == "Truncate":
        out = np.where(mask, threshold, gray)
    elif thresh_type == "To Zero":
        out = np.where(mask, gray, 0)
    else:  # To Zero Inverted
        out = np.where(mask, 0, gray)

    return out.astype(np.uint8)
