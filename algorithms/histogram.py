"""Algoritma Analisis: Histogram Citra (Grayscale & RGB).

Menghitung distribusi frekuensi intensitas piksel pada rentang [0, 255]
secara manual tanpa cv2.calcHist:
    h(k) = jumlah piksel dengan nilai intensitas = k
"""
from __future__ import annotations

import numpy as np

from .utils import to_gray_float


def compute_channel_histogram(channel: np.ndarray) -> np.ndarray:
    """Hitung histogram 256-bin dari satu kanal citra uint8 secara manual."""
    # Pastikan data bertipe uint8 [0..255] lalu hitung frekuensi tiap nilai intensitas
    u8 = np.clip(channel, 0, 255).astype(np.uint8)
    return np.bincount(u8.ravel(), minlength=256).astype(np.float32)


def apply_grayscale_histogram(img: np.ndarray) -> dict:
    """Hitung data histogram grayscale (BT.601) untuk panel Analysis."""
    gray = np.clip(to_gray_float(img) + 0.5, 0, 255).astype(np.uint8)
    counts = compute_channel_histogram(gray)
    return {
        "type": "histogram",
        "title": "Grayscale Histogram",
        "series": [("Gray", counts, "#c8c8c8")],
    }


def apply_rgb_histogram(img: np.ndarray) -> dict:
    """Hitung data histogram kanal Red, Green, dan Blue secara terpisah."""
    # Konvensi OpenCV BGR: indeks 0 = Blue, 1 = Green, 2 = Red
    hist_r = compute_channel_histogram(img[..., 2])
    hist_g = compute_channel_histogram(img[..., 1])
    hist_b = compute_channel_histogram(img[..., 0])
    return {
        "type": "histogram",
        "title": "RGB Histogram",
        "series": [
            ("Red", hist_r, "#ff5a5a"),
            ("Green", hist_g, "#5aff7a"),
            ("Blue", hist_b, "#5a8cff"),
        ],
    }
