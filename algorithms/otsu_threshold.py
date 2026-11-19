"""Algoritma Hebat: Otsu Threshold (Pengambangan Otomatis Berbasis Varians).

Menentukan nilai ambang optimal T* secara otomatis tanpa input manual dengan
memaksimalkan Between-Class Variance (varians antar kelas latar & objek):
    sigma_B^2(T) = w0(T) * w1(T) * (mu0(T) - mu1(T))^2
"""
from __future__ import annotations

import numpy as np

from .utils import to_gray_float


def compute_otsu_threshold(gray: np.ndarray) -> int:
    """Cari nilai threshold optimal T* (0..254) menggunakan metode Nobuyuki Otsu."""
    # Langkah 1: Hitung histogram 256 level lalu ubah ke distribusi probabilitas p(k)
    hist = np.bincount(gray.ravel(), minlength=256).astype(np.float64)
    total = float(gray.size)
    if total == 0:
        return 127
    prob = hist / total

    # Langkah 2: Hitung bobot kelas kumulatif w0(T), w1(T) dan rata-rata kumulatif mu(T)
    levels = np.arange(256, dtype=np.float64)
    w0 = np.cumsum(prob)
    w1 = 1.0 - w0
    cum_mean = np.cumsum(levels * prob)
    total_mean = float(cum_mean[-1])

    # Langkah 3: Hitung between-class variance untuk setiap kandidat ambang T = 0..254
    valid = (w0[:-1] > 0.0) & (w1[:-1] > 0.0)
    between_var = np.zeros(255, dtype=np.float64)
    mu0 = cum_mean[:-1][valid] / w0[:-1][valid]
    mu1 = (total_mean - cum_mean[:-1][valid]) / w1[:-1][valid]
    between_var[valid] = w0[:-1][valid] * w1[:-1][valid] * ((mu0 - mu1) ** 2)

    if not valid.any():
        return 127

    # Langkah 4: Ambil T* yang memaksimalkan between-class variance (rata-rata jika ada nilai kembar)
    max_var = float(between_var.max())
    best_indices = np.where(np.isclose(between_var, max_var, rtol=0.0, atol=1e-12))[0]
    return int(np.mean(best_indices))


def apply_otsu_threshold(img: np.ndarray, thresh_type: str = "Binary") -> np.ndarray:
    """Terapkan threshold otomatis Otsu secara manual tanpa cv2.THRESH_OTSU."""
    gray = np.clip(to_gray_float(img) + 0.5, 0, 255).astype(np.uint8)
    t_opt = compute_otsu_threshold(gray)
    mask = gray > t_opt

    if thresh_type == "Binary":
        out = np.where(mask, 255, 0)
    elif thresh_type == "Binary Inverted":
        out = np.where(mask, 0, 255)
    elif thresh_type == "Truncate":
        out = np.where(mask, t_opt, gray)
    elif thresh_type == "To Zero":
        out = np.where(mask, gray, 0)
    else:  # To Zero Inverted
        out = np.where(mask, 0, gray)

    return out.astype(np.uint8)
