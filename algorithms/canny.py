"""Algoritma Hebat: Canny Edge Detection (Deteksi Tepi 4 Tahap).

Implementasi lengkap 4 tahap algoritma Canny secara manual (pure NumPy):
  1. Gaussian Smoothing untuk meredam noise awal.
  2. Gradien Sobel (Gx, Gy) -> Magnitudo |G| dan Arah Sudut theta = atan2(Gy, Gx).
  3. Non-Maximum Suppression (NMS) untuk menipiskan garis tepi menjadi 1 piksel.
  4. Double Thresholding (T1, T2) + Hysteresis Edge Tracking (konektivitas 8 tetangga).
"""
from __future__ import annotations

import numpy as np

from .utils import convolve2d, convolve_separable, gaussian_kernel_1d, to_gray_float


def _non_maximum_suppression(mag: np.ndarray, angle_deg: np.ndarray) -> np.ndarray:
    """Tahap 3: Pertahankan hanya piksel yang merupakan puncak lokal sepanjang arah gradien."""
    h, w = mag.shape
    pad = np.pad(mag, 1, mode="constant", constant_values=0.0)

    # Irisan 8 tetangga terhadap pusat [1:h+1, 1:w+1]
    left = pad[1 : h + 1, 0:w]
    right = pad[1 : h + 1, 2 : w + 2]
    top = pad[0:h, 1 : w + 1]
    bottom = pad[2 : h + 2, 1 : w + 1]
    top_left = pad[0:h, 0:w]
    top_right = pad[0:h, 2 : w + 2]
    bottom_left = pad[2 : h + 2, 0:w]
    bottom_right = pad[2 : h + 2, 2 : w + 2]

    # Kuantisasi sudut gradien ke 4 orientasi utama: 0°, 45°, 90°, 135°
    deg = angle_deg % 180.0
    is_0 = (deg < 22.5) | (deg >= 157.5)
    is_45 = (deg >= 22.5) & (deg < 67.5)
    is_90 = (deg >= 67.5) & (deg < 112.5)
    is_135 = (deg >= 112.5) & (deg < 157.5)

    # Pembanding asimetris: strictly '>' terhadap tetangga "sebelum" dan '>=' terhadap
    # tetangga "sesudah". Pada tepi tangga (dua piksel bermagnitudo sama) hanya SATU
    # piksel yang lolos, sehingga garis tepi benar-benar setebal 1 piksel.
    keep = (
        (is_0 & (mag > left) & (mag >= right))
        | (is_45 & (mag > top_left) & (mag >= bottom_right))
        | (is_90 & (mag > top) & (mag >= bottom))
        | (is_135 & (mag > top_right) & (mag >= bottom_left))
    )
    return np.where(keep, mag, 0.0).astype(np.float32)


def _hysteresis(nms: np.ndarray, t_low: float, t_high: float) -> np.ndarray:
    """Tahap 4: Double Threshold + propagasi piksel tepi lemah yang terhubung ke tepi kuat."""
    strong = nms >= t_high
    weak = (nms >= t_low) & (nms < t_high)

    edges = strong.copy()
    h, w = edges.shape

    # Propagasi iteratif: tepi lemah diterima jika bertetangga (8-arah) dengan tepi kuat
    while True:
        pad = np.pad(edges, 1, mode="constant", constant_values=False)
        has_strong_neighbor = (
            pad[0:h, 0:w] | pad[0:h, 1 : w + 1] | pad[0:h, 2 : w + 2]
            | pad[1 : h + 1, 0:w] | pad[1 : h + 1, 2 : w + 2]
            | pad[2 : h + 2, 0:w] | pad[2 : h + 2, 1 : w + 1] | pad[2 : h + 2, 2 : w + 2]
        )
        promoted = weak & has_strong_neighbor & (~edges)
        if not promoted.any():
            break
        edges |= promoted

    return (edges.astype(np.uint8) * 255)


def apply_canny(
    img: np.ndarray,
    t1: int = 50,
    t2: int = 150,
    blur: bool = True,
) -> np.ndarray:
    # Tahap 1: Konversi ke grayscale dan haluskan dengan Gaussian 5x5 (opsional)
    gray = to_gray_float(img)
    if blur:
        k1d = gaussian_kernel_1d(5, sigma=0.0)
        gray = convolve_separable(gray, k1d)

    # Tahap 2: Hitung gradien Sobel X dan Y, lalu magnitudo |G| dan arah sudut (derajat)
    kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    ky = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
    gx = convolve2d(gray, kx)
    gy = convolve2d(gray, ky)

    magnitude = np.hypot(gx, gy)
    angle_deg = np.degrees(np.arctan2(gy, gx))

    # Tahap 3: Non-Maximum Suppression untuk menipiskan tepi menjadi 1 piksel
    nms = _non_maximum_suppression(magnitude, angle_deg)

    # Tahap 4: Double Threshold & Hysteresis Edge Tracking
    low = float(min(t1, t2))
    high = float(max(t1, t2))
    return _hysteresis(nms, low, high)
