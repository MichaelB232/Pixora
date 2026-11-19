"""Pixora - Processing Engine & Registry.

Menghubungkan GUI dengan 9 algoritma pengolahan citra terisolasi di paket `algorithms/`.
Seluruh proses pemrosesan citra di sini dan di `algorithms/` berjalan murni
menggunakan perhitungan matematis NumPy (tanpa fungsi pemrosesan instan `cv2`).

Konvensi:
  * Gambar input selalu BGR uint8 (konvensi channel B, G, R).
  * Metode bertipe "process" mengembalikan citra baru (dinormalisasi ke BGR uint8).
  * Semua fungsi bersifat non-destructive (tidak mengubah gambar input asli).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional

import numpy as np

from algorithms import (
    apply_adaptive_threshold,
    apply_binary_threshold,
    apply_blur,
    apply_brightness,
    apply_canny,
    apply_contrast,
    apply_equalization,
    apply_grayscale,
    apply_grayscale_histogram,
    apply_negative,
    apply_otsu_threshold,
    apply_rgb_histogram,
    apply_sharpening,
    apply_sobel,
)

# --------------------------------------------------------------------------------------
# Struktur data registry
# --------------------------------------------------------------------------------------

CATEGORIES = [
    "Basic Processing",
    "Histogram",
    "Enhancement",
    "Filtering",
    "Edge Detection",
]


@dataclass
class Param:
    key: str
    label: str
    kind: str  # "int" | "float" | "choice" | "bool"
    default: Any
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    step: float = 1
    choices: Optional[list] = None
    tip: str = ""
    odd: bool = False  # nilai harus ganjil (ukuran kernel)

    def coerce(self, value: Any) -> Any:
        """Ubah nilai mentah menjadi nilai valid sesuai tipe dan batas parameter."""
        if value is None:
            value = self.default
        if self.kind == "bool":
            return bool(value)
        if self.kind == "choice":
            return value if value in (self.choices or []) else self.default
        v = float(value)
        if self.minimum is not None:
            v = max(self.minimum, v)
        if self.maximum is not None:
            v = min(self.maximum, v)
        if self.kind == "int":
            iv = int(round(v))
            if self.odd and iv % 2 == 0:
                iv += 1
                if self.maximum is not None and iv > self.maximum:
                    iv -= 2
                iv = max(iv, 1)
            return iv
        return float(v)


@dataclass
class Method:
    id: str
    name: str
    category: str
    kind: str  # "process" | "analysis"
    params: list
    func: Callable
    description: str = ""

    def defaults(self) -> dict:
        return {p.key: p.default for p in self.params}

    def resolve(self, values: Optional[dict] = None) -> dict:
        values = values or {}
        return {p.key: p.coerce(values.get(p.key, p.default)) for p in self.params}


METHODS: dict[str, Method] = {}


def register(category: str, name: str, params=(), kind: str = "process"):
    def deco(fn: Callable) -> Callable:
        mid = f"{category}/{name}"
        METHODS[mid] = Method(mid, name, category, kind, list(params), fn)
        return fn

    return deco


def methods_in(category: str) -> list[Method]:
    return [m for m in METHODS.values() if m.category == category]


# Helper pembuat parameter ---------------------------------------------------------------
def I(key, label, default, lo, hi, step=1, odd=False, tip=""):
    return Param(key, label, "int", default, lo, hi, step, None, tip, odd)


def F(key, label, default, lo, hi, step=0.1, tip=""):
    return Param(key, label, "float", default, lo, hi, step, None, tip)


def C(key, label, choices, default=None, tip=""):
    return Param(key, label, "choice", default if default is not None else choices[0], None, None, 1, list(choices), tip)


def B(key, label, default=False, tip=""):
    return Param(key, label, "bool", default, tip=tip)


# --------------------------------------------------------------------------------------
# Utilitas umum (murni NumPy)
# --------------------------------------------------------------------------------------

def to_bgr(img: np.ndarray) -> np.ndarray:
    """Normalisasi hasil apa pun menjadi BGR uint8 3 kanal tanpa cv2."""
    if img.dtype != np.uint8:
        img = np.clip(img, 0, 255).astype(np.uint8)
    if img.ndim == 2:
        return np.ascontiguousarray(np.stack([img, img, img], axis=-1))
    if img.shape[2] == 1:
        g = img[:, :, 0]
        return np.ascontiguousarray(np.stack([g, g, g], axis=-1))
    if img.shape[2] == 4:
        return np.ascontiguousarray(img[:, :, :3])
    return np.ascontiguousarray(img)


# --------------------------------------------------------------------------------------
# 1. BASIC PROCESSING (Grayscale, Negative, Binary Threshold, Adaptive Threshold)
# --------------------------------------------------------------------------------------
CAT = "Basic Processing"

_THRESH_TYPES = ["Binary", "Binary Inverted", "Truncate", "To Zero", "To Zero Inverted"]


@register(CAT, "Grayscale", [
    C("conversion", "Conversion Method",
      ["Luminosity (BT.601)", "Luminosity (BT.709)", "Average", "Lightness"]),
])
def grayscale(img, conversion="Luminosity (BT.601)", **_):
    return apply_grayscale(img, conversion=conversion)


@register(CAT, "Negative")
def negative(img, **_):
    return apply_negative(img)


@register(CAT, "Binary Threshold", [
    I("threshold", "Threshold", 127, 0, 255),
    I("max_value", "Max Value", 255, 1, 255),
    C("type", "Threshold Type", _THRESH_TYPES),
])
def binary_threshold(img, threshold=127, max_value=255, type="Binary", **_):
    return apply_binary_threshold(img, threshold=threshold, max_value=max_value, thresh_type=type)


@register(CAT, "Adaptive Threshold", [
    I("block_size", "Block Size", 11, 3, 101, odd=True, tip="Ukuran area lokal (ganjil)."),
    I("c", "C (konstanta)", 2, -30, 30),
    C("method", "Adaptive Method", ["Gaussian", "Mean"]),
])
def adaptive_threshold(img, block_size=11, c=2, method="Gaussian", **_):
    return apply_adaptive_threshold(img, block_size=block_size, c=c, method=method)


@register(CAT, "Otsu Threshold", [C("type", "Threshold Type", _THRESH_TYPES)])
def otsu_threshold(img, type="Binary", **_):
    return apply_otsu_threshold(img, thresh_type=type)


# --------------------------------------------------------------------------------------
# 2. HISTOGRAM (Grayscale Histogram, RGB Histogram, Equalization)
# --------------------------------------------------------------------------------------
CAT = "Histogram"
_SRC = C("source", "Analysis Source", ["Original Image", "Processed Image"], tip="Gambar yang dianalisis.")


@register(CAT, "Grayscale Histogram", [_SRC], kind="analysis")
def hist_gray(img, **_):
    return apply_grayscale_histogram(img)


@register(CAT, "RGB Histogram", [_SRC], kind="analysis")
def hist_rgb(img, **_):
    return apply_rgb_histogram(img)


@register(CAT, "Histogram Equalization", [
    C("mode", "Mode", ["Luminance (color)", "Grayscale"],
      tip="Luminance: hanya kanal Y (YCbCr) yang diratakan agar warna asli terjaga."),
])
def hist_equalization(img, mode="Luminance (color)", **_):
    return apply_equalization(img, mode=mode)


# --------------------------------------------------------------------------------------
# 3. ENHANCEMENT (Brightness, Contrast, Sharpening)
# --------------------------------------------------------------------------------------
CAT = "Enhancement"


@register(CAT, "Brightness", [I("value", "Brightness", 0, -100, 100)])
def brightness(img, value=0, **_):
    return apply_brightness(img, value=value)


@register(CAT, "Contrast", [I("value", "Contrast (%)", 100, 0, 300)])
def contrast(img, value=100, **_):
    return apply_contrast(img, value=value)


@register(CAT, "Sharpening", [
    C("method", "Method", ["Unsharp Mask", "Laplacian Kernel"]),
    I("strength", "Strength (%)", 100, 0, 300),
    F("radius", "Radius (sigma - Unsharp Mask)", 1.5, 0.3, 10.0, 0.1),
])
def sharpening(img, method="Unsharp Mask", strength=100, radius=1.5, **_):
    return apply_sharpening(img, method=method, strength=strength, radius=radius)


# --------------------------------------------------------------------------------------
# 4. FILTERING (Blur)
# --------------------------------------------------------------------------------------
CAT = "Filtering"


@register(CAT, "Blur", [
    C("method", "Method", ["Gaussian", "Mean (Box)"]),
    I("ksize", "Kernel Size", 5, 1, 51, odd=True),
    F("sigma", "Sigma (0 = otomatis)", 0.0, 0.0, 30.0, 0.1),
])
def blur(img, method="Gaussian", ksize=5, sigma=0.0, **_):
    return apply_blur(img, method=method, ksize=ksize, sigma=sigma)


# --------------------------------------------------------------------------------------
# 5. EDGE DETECTION (Sobel, Canny)
# --------------------------------------------------------------------------------------
CAT = "Edge Detection"


@register(CAT, "Sobel", [
    C("ksize", "Kernel Size", ["1", "3", "5", "7"], "3"),
    C("direction", "Direction", ["Both", "X (Horizontal)", "Y (Vertical)"]),
])
def sobel(img, ksize="3", direction="Both", **_):
    return apply_sobel(img, ksize=ksize, direction=direction)


@register(CAT, "Canny", [
    I("t1", "Threshold 1 (Low)", 100, 0, 500),
    I("t2", "Threshold 2 (High)", 200, 0, 500),
    B("blur", "Gaussian Blur 5x5 sebelum Canny", True),
])
def canny(img, t1=100, t2=200, blur=True, **_):
    return apply_canny(img, t1=t1, t2=t2, blur=blur)


# --------------------------------------------------------------------------------------
# Runner & pipeline
# --------------------------------------------------------------------------------------

def run_method(method_id: str, img: np.ndarray, params: Optional[dict] = None):
    """Jalankan satu metode. Gambar input tidak pernah dimodifikasi."""
    m = METHODS[method_id]
    p = m.resolve(params)
    out = m.func(img.copy(), **p)
    return out if m.kind == "analysis" else to_bgr(out)


def describe_params(method_id: str, params: dict) -> str:
    m = METHODS[method_id]
    p = m.resolve(params)
    if not m.params:
        return "-"
    labels = {x.key: x.label.split(" (")[0] for x in m.params}
    return ", ".join(f"{labels[k]}={v}" for k, v in p.items() if k != "source")


@dataclass
class PipelineStep:
    method_id: str
    params: dict = field(default_factory=dict)
    enabled: bool = True

    @property
    def label(self) -> str:
        return METHODS[self.method_id].name


def run_pipeline(original: np.ndarray, steps: list, cancel: Optional[Callable[[], bool]] = None) -> np.ndarray:
    """Terapkan setiap langkah aktif secara berurutan pada hasil langkah sebelumnya."""
    cur = original
    for s in steps:
        if cancel and cancel():
            raise InterruptedError("Pemrosesan dibatalkan.")
        if not s.enabled or METHODS[s.method_id].kind != "process":
            continue
        cur = run_method(s.method_id, cur, s.params)
    return cur.copy()
