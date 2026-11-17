"""Pixora - Processing Engine.

Semua algoritma pengolahan citra didefinisikan di sini sebagai *registry* metode.
Setiap metode memiliki: kategori, daftar parameter (untuk membangun UI secara dinamis),
dan fungsi pemrosesan murni (tidak mengubah gambar input / non-destructive).

Konvensi:
  * Gambar input selalu BGR uint8 (format OpenCV).
  * Metode bertipe "process" mengembalikan citra baru (dinormalisasi ke BGR uint8).
  * Metode bertipe "analysis" mengembalikan dict hasil analisis (histogram, statistik, ...)
    dan TIDAK mengubah citra hasil.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional

import cv2
import numpy as np

# --------------------------------------------------------------------------------------
# Struktur data registry
# --------------------------------------------------------------------------------------

CATEGORIES = [
    "Basic Processing",
    "Histogram",
    "Enhancement",
    "Filtering",
    "Edge Detection",
    "Morphology",
    "Segmentation",
    "Transformation",
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
# Utilitas umum
# --------------------------------------------------------------------------------------

def to_bgr(img: np.ndarray) -> np.ndarray:
    """Normalisasi hasil apa pun menjadi BGR uint8 3 kanal."""
    if img.dtype != np.uint8:
        img = np.clip(img, 0, 255).astype(np.uint8)
    if img.ndim == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.shape[2] == 1:
        return cv2.cvtColor(img[:, :, 0], cv2.COLOR_GRAY2BGR)
    if img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return np.ascontiguousarray(img)


def gray_of(img: np.ndarray) -> np.ndarray:
    if img.ndim == 2:
        return img
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def _norm_u8(a: np.ndarray) -> np.ndarray:
    return cv2.normalize(a, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def _kernel(shape: str, k: int) -> np.ndarray:
    code = {"Rectangle": cv2.MORPH_RECT, "Ellipse": cv2.MORPH_ELLIPSE, "Cross": cv2.MORPH_CROSS}[shape]
    return cv2.getStructuringElement(code, (k, k))


THRESH_TYPES = {
    "Binary": cv2.THRESH_BINARY,
    "Binary Inverted": cv2.THRESH_BINARY_INV,
    "Truncate": cv2.THRESH_TRUNC,
    "To Zero": cv2.THRESH_TOZERO,
    "To Zero Inverted": cv2.THRESH_TOZERO_INV,
}

# --------------------------------------------------------------------------------------
# 5.1 BASIC PROCESSING
# --------------------------------------------------------------------------------------
CAT = "Basic Processing"


@register(CAT, "Grayscale", [C("conversion", "Conversion Method",
                               ["Luminosity (BT.601)", "Luminosity (BT.709)", "Average", "Lightness"])])
def grayscale(img, conversion="Luminosity (BT.601)", **_):
    f = img.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    if conversion == "Luminosity (BT.601)":
        out = 0.299 * r + 0.587 * g + 0.114 * b
    elif conversion == "Luminosity (BT.709)":
        out = 0.2126 * r + 0.7152 * g + 0.0722 * b
    elif conversion == "Average":
        out = (r + g + b) / 3.0
    else:  # Lightness
        out = (f.max(axis=2) + f.min(axis=2)) / 2.0
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


@register(CAT, "Negative")
def negative(img, **_):
    return cv2.bitwise_not(img)


@register(CAT, "Binary Threshold", [
    I("threshold", "Threshold", 127, 0, 255),
    I("max_value", "Max Value", 255, 1, 255),
    C("type", "Threshold Type", list(THRESH_TYPES)),
])
def binary_threshold(img, threshold=127, max_value=255, type="Binary", **_):
    _t, out = cv2.threshold(gray_of(img), threshold, max_value, THRESH_TYPES[type])
    return out


@register(CAT, "Adaptive Threshold", [
    I("block_size", "Block Size", 11, 3, 101, odd=True, tip="Ukuran area lokal (ganjil)."),
    I("c", "C (konstanta)", 2, -30, 30),
    C("method", "Adaptive Method", ["Gaussian", "Mean"]),
])
def adaptive_threshold(img, block_size=11, c=2, method="Gaussian", **_):
    m = cv2.ADAPTIVE_THRESH_GAUSSIAN_C if method == "Gaussian" else cv2.ADAPTIVE_THRESH_MEAN_C
    return cv2.adaptiveThreshold(gray_of(img), 255, m, cv2.THRESH_BINARY, block_size, c)


@register(CAT, "Otsu Threshold", [C("type", "Threshold Type", ["Binary", "Binary Inverted", "Truncate", "To Zero", "To Zero Inverted"])])
def otsu_threshold(img, type="Binary", **_):
    _t, out = cv2.threshold(gray_of(img), 0, 255, THRESH_TYPES[type] + cv2.THRESH_OTSU)
    return out


@register(CAT, "Sepia", [I("intensity", "Intensity (%)", 100, 0, 100)])
def sepia(img, intensity=100, **_):
    m = np.array([[0.131, 0.534, 0.272],
                  [0.168, 0.686, 0.349],
                  [0.189, 0.769, 0.393]], dtype=np.float32)  # baris = B,G,R keluaran
    sep = cv2.transform(img.astype(np.float32), m)
    t = intensity / 100.0
    return np.clip(img * (1 - t) + sep * t, 0, 255).astype(np.uint8)


@register(CAT, "Channel Extraction", [
    B("red", "Red", True), B("green", "Green", False), B("blue", "Blue", False),
])
def channel_extraction(img, red=True, green=False, blue=False, **_):
    out = np.zeros_like(img)
    if blue:
        out[..., 0] = img[..., 0]
    if green:
        out[..., 1] = img[..., 1]
    if red:
        out[..., 2] = img[..., 2]
    return out


@register(CAT, "Color to Binary", [I("threshold", "Threshold", 127, 0, 255)])
def color_to_binary(img, threshold=127, **_):
    _t, out = cv2.threshold(gray_of(img), threshold, 255, cv2.THRESH_BINARY)
    return out


# --------------------------------------------------------------------------------------
# 5.2 HISTOGRAM & ANALYSIS
# --------------------------------------------------------------------------------------
CAT = "Histogram"
_SRC = C("source", "Analysis Source", ["Original Image", "Processed Image"], tip="Gambar yang dianalisis.")


def _calc_hist(ch: np.ndarray) -> np.ndarray:
    return cv2.calcHist([ch], [0], None, [256], [0, 256]).flatten()


@register(CAT, "Grayscale Histogram", [_SRC], kind="analysis")
def hist_gray(img, **_):
    return {"type": "histogram", "title": "Grayscale Histogram",
            "series": [("Gray", _calc_hist(gray_of(img)), "#c8c8c8")]}


@register(CAT, "RGB Histogram", [_SRC], kind="analysis")
def hist_rgb(img, **_):
    return {"type": "histogram", "title": "RGB Histogram",
            "series": [("Red", _calc_hist(img[..., 2]), "#ff5a5a"),
                       ("Green", _calc_hist(img[..., 1]), "#5aff7a"),
                       ("Blue", _calc_hist(img[..., 0]), "#5a8cff")]}


@register(CAT, "Red Histogram", [_SRC], kind="analysis")
def hist_red(img, **_):
    return {"type": "histogram", "title": "Red Channel Histogram",
            "series": [("Red", _calc_hist(img[..., 2]), "#ff5a5a")]}


@register(CAT, "Green Histogram", [_SRC], kind="analysis")
def hist_green(img, **_):
    return {"type": "histogram", "title": "Green Channel Histogram",
            "series": [("Green", _calc_hist(img[..., 1]), "#5aff7a")]}


@register(CAT, "Blue Histogram", [_SRC], kind="analysis")
def hist_blue(img, **_):
    return {"type": "histogram", "title": "Blue Channel Histogram",
            "series": [("Blue", _calc_hist(img[..., 0]), "#5a8cff")]}


@register(CAT, "Histogram Equalization", [
    C("mode", "Mode", ["Luminance (color)", "Grayscale"], tip="Luminance: hanya kanal Y (YCrCb) yang diratakan."),
])
def hist_equalization(img, mode="Luminance (color)", **_):
    if mode == "Grayscale":
        return cv2.equalizeHist(gray_of(img))
    ycc = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    ycc[..., 0] = cv2.equalizeHist(ycc[..., 0])
    return cv2.cvtColor(ycc, cv2.COLOR_YCrCb2BGR)


@register(CAT, "CLAHE", [
    F("clip_limit", "Clip Limit", 2.0, 1.0, 40.0, 0.5),
    I("tile", "Tile Grid Size", 8, 2, 32),
])
def clahe(img, clip_limit=2.0, tile=8, **_):
    c = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile, tile))
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    lab[..., 0] = c.apply(lab[..., 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


@register(CAT, "Pixel Inspector", [_SRC], kind="analysis")
def pixel_inspector(img, **_):
    return {"type": "inspector", "title": "Pixel Inspector"}


@register(CAT, "Image Statistics", [_SRC], kind="analysis")
def image_statistics(img, **_):
    h, w = img.shape[:2]
    g = gray_of(img)
    hist = _calc_hist(g)
    p = hist / max(hist.sum(), 1)
    p = p[p > 0]
    entropy = float(-(p * np.log2(p)).sum())
    lines = [f"Resolusi        : {w} x {h} px   ({w * h:,} piksel)", ""]
    lines.append(f"{'Kanal':<8}{'Mean':>9}{'Std':>9}{'Min':>6}{'Max':>6}{'Median':>9}")
    for name, ch in (("Red", img[..., 2]), ("Green", img[..., 1]), ("Blue", img[..., 0]), ("Gray", g)):
        lines.append(f"{name:<8}{ch.mean():9.2f}{ch.std():9.2f}{int(ch.min()):6d}{int(ch.max()):6d}{np.median(ch):9.1f}")
    lines += ["", f"Entropi (gray)  : {entropy:.3f} bit",
              f"Piksel unik     : {len(np.unique(img.reshape(-1, 3), axis=0)):,} warna"]
    return {"type": "text", "title": "Image Statistics", "text": "\n".join(lines)}


# --------------------------------------------------------------------------------------
# 5.3 ENHANCEMENT & ADJUSTMENT
# --------------------------------------------------------------------------------------
CAT = "Enhancement"


def _brightness(img, v):
    return np.clip(img.astype(np.float32) + v, 0, 255).astype(np.uint8)


def _contrast(img, pct):
    return np.clip((img.astype(np.float32) - 128.0) * (pct / 100.0) + 128.0, 0, 255).astype(np.uint8)


def _gamma(img, g):
    lut = np.array([255.0 * (i / 255.0) ** (1.0 / g) for i in range(256)], dtype=np.float32)
    return cv2.LUT(img, np.clip(lut, 0, 255).astype(np.uint8))


def _saturation(img, pct):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * (pct / 100.0), 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def _hue(img, deg):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hsv[..., 0] = ((hsv[..., 0].astype(np.int16) + int(round(deg / 2.0))) % 180).astype(np.uint8)
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)


@register(CAT, "Brightness", [I("value", "Brightness", 0, -100, 100)])
def brightness(img, value=0, **_):
    return _brightness(img, value)


@register(CAT, "Contrast", [I("value", "Contrast (%)", 100, 0, 300)])
def contrast(img, value=100, **_):
    return _contrast(img, value)


@register(CAT, "Saturation", [I("value", "Saturation (%)", 100, 0, 200)])
def saturation(img, value=100, **_):
    return _saturation(img, value)


@register(CAT, "Hue", [I("value", "Hue (derajat)", 0, -180, 180)])
def hue(img, value=0, **_):
    return _hue(img, value)


@register(CAT, "Gamma Correction", [F("gamma", "Gamma", 1.0, 0.1, 3.0, 0.05)])
def gamma_correction(img, gamma=1.0, **_):
    return _gamma(img, gamma)


@register(CAT, "Exposure", [F("ev", "Exposure (EV)", 0.0, -3.0, 3.0, 0.1)])
def exposure(img, ev=0.0, **_):
    return np.clip(img.astype(np.float32) * (2.0 ** ev), 0, 255).astype(np.uint8)


@register(CAT, "Sharpness", [
    I("strength", "Strength (%)", 100, 0, 300),
    F("radius", "Radius (sigma)", 1.5, 0.3, 10.0, 0.1),
])
def sharpness(img, strength=100, radius=1.5, **_):
    blur = cv2.GaussianBlur(img, (0, 0), radius)
    return cv2.addWeighted(img, 1 + strength / 100.0, blur, -strength / 100.0, 0)


@register(CAT, "Color Temperature", [I("temperature", "Temperature (Cool -100 ... +100 Warm)", 0, -100, 100)])
def color_temperature(img, temperature=0, **_):
    f = img.astype(np.float32)
    d = temperature * 0.5
    f[..., 2] += d
    f[..., 0] -= d
    return np.clip(f, 0, 255).astype(np.uint8)


@register(CAT, "Vibrance", [I("intensity", "Intensity", 50, 0, 100)])
def vibrance(img, intensity=50, **_):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    s = hsv[..., 1]
    hsv[..., 1] = np.clip(s * (1 + (intensity / 100.0) * (1 - s / 255.0)), 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


@register(CAT, "Combined Adjustment", [
    I("brightness", "Brightness", 0, -100, 100),
    I("contrast", "Contrast (%)", 100, 0, 300),
    I("saturation", "Saturation (%)", 100, 0, 200),
    I("hue", "Hue (derajat)", 0, -180, 180),
    F("gamma", "Gamma", 1.0, 0.1, 3.0, 0.05),
])
def combined_adjustment(img, brightness=0, contrast=100, saturation=100, hue=0, gamma=1.0, **_):
    """Beberapa parameter diterapkan sekaligus dalam satu kali Apply."""
    out = _contrast(img, contrast)
    out = _brightness(out, brightness)
    out = _gamma(out, gamma)
    out = _saturation(out, saturation)
    out = _hue(out, hue)
    return out


# --------------------------------------------------------------------------------------
# 5.4 FILTERING & NOISE REDUCTION
# --------------------------------------------------------------------------------------
CAT = "Filtering"
_K = I("ksize", "Kernel Size", 5, 1, 51, odd=True)


@register(CAT, "Mean Filter", [_K])
def mean_filter(img, ksize=5, **_):
    return cv2.blur(img, (ksize, ksize))


@register(CAT, "Gaussian Blur", [_K, F("sigma", "Sigma (0 = otomatis)", 0.0, 0.0, 30.0, 0.1)])
def gaussian_blur(img, ksize=5, sigma=0.0, **_):
    return cv2.GaussianBlur(img, (ksize, ksize), sigma)


@register(CAT, "Median Filter", [I("ksize", "Kernel Size", 5, 1, 51, odd=True)])
def median_filter(img, ksize=5, **_):
    return cv2.medianBlur(img, ksize)


@register(CAT, "Bilateral Filter", [
    I("diameter", "Diameter", 9, 1, 25),
    F("sigma_color", "Sigma Color", 75.0, 1.0, 250.0, 1.0),
    F("sigma_space", "Sigma Space", 75.0, 1.0, 250.0, 1.0),
])
def bilateral_filter(img, diameter=9, sigma_color=75.0, sigma_space=75.0, **_):
    return cv2.bilateralFilter(img, diameter, sigma_color, sigma_space)


@register(CAT, "Min Filter", [I("ksize", "Kernel Size", 3, 1, 51, odd=True)])
def min_filter(img, ksize=3, **_):
    return cv2.erode(img, np.ones((ksize, ksize), np.uint8))


@register(CAT, "Max Filter", [I("ksize", "Kernel Size", 3, 1, 51, odd=True)])
def max_filter(img, ksize=3, **_):
    return cv2.dilate(img, np.ones((ksize, ksize), np.uint8))


@register(CAT, "Box Blur", [_K, B("normalize", "Normalize", True)])
def box_blur(img, ksize=5, normalize=True, **_):
    return cv2.boxFilter(img, -1, (ksize, ksize), normalize=normalize)


# --------------------------------------------------------------------------------------
# 5.5 EDGE DETECTION
# --------------------------------------------------------------------------------------
CAT = "Edge Detection"
_DIR = C("direction", "Direction", ["Both", "X (Horizontal)", "Y (Vertical)"])


def _directional(gx_fn, gy_fn, direction):
    if direction.startswith("X"):
        return _norm_u8(np.abs(gx_fn()))
    if direction.startswith("Y"):
        return _norm_u8(np.abs(gy_fn()))
    return _norm_u8(cv2.magnitude(gx_fn(), gy_fn()))


@register(CAT, "Sobel", [
    C("ksize", "Kernel Size", ["1", "3", "5", "7"], "3"),
    _DIR,
])
def sobel(img, ksize="3", direction="Both", **_):
    g, k = gray_of(img), int(ksize)
    return _directional(lambda: cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=k),
                        lambda: cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=k), direction)


@register(CAT, "Prewitt", [_DIR])
def prewitt(img, direction="Both", **_):
    g = gray_of(img).astype(np.float32)
    kx = np.array([[1, 0, -1], [1, 0, -1], [1, 0, -1]], dtype=np.float32)
    ky = np.array([[1, 1, 1], [0, 0, 0], [-1, -1, -1]], dtype=np.float32)
    return _directional(lambda: cv2.filter2D(g, cv2.CV_32F, kx),
                        lambda: cv2.filter2D(g, cv2.CV_32F, ky), direction)


@register(CAT, "Laplacian", [I("ksize", "Kernel Size", 3, 1, 31, odd=True)])
def laplacian(img, ksize=3, **_):
    return _norm_u8(np.abs(cv2.Laplacian(gray_of(img), cv2.CV_32F, ksize=ksize)))


@register(CAT, "Canny", [
    I("t1", "Threshold 1", 100, 0, 500),
    I("t2", "Threshold 2", 200, 0, 500),
    B("blur", "Gaussian Blur 5x5 sebelum Canny", True),
])
def canny(img, t1=100, t2=200, blur=True, **_):
    g = gray_of(img)
    if blur:
        g = cv2.GaussianBlur(g, (5, 5), 0)
    return cv2.Canny(g, t1, t2)


@register(CAT, "Scharr", [_DIR])
def scharr(img, direction="Both", **_):
    g = gray_of(img)
    return _directional(lambda: cv2.Scharr(g, cv2.CV_32F, 1, 0),
                        lambda: cv2.Scharr(g, cv2.CV_32F, 0, 1), direction)


# --------------------------------------------------------------------------------------
# 5.6 MORPHOLOGICAL OPERATIONS
# --------------------------------------------------------------------------------------
CAT = "Morphology"
_MORPH_PARAMS = [
    C("shape", "Kernel Shape", ["Rectangle", "Ellipse", "Cross"]),
    I("ksize", "Kernel Size", 3, 1, 51, odd=True),
    I("iterations", "Iterations", 1, 1, 20),
]


def _make_morph(name, op):
    @register(CAT, name, _MORPH_PARAMS)
    def _fn(img, shape="Rectangle", ksize=3, iterations=1, **_):
        return cv2.morphologyEx(img, op, _kernel(shape, ksize), iterations=iterations)

    _fn.__name__ = name.lower().replace(" ", "_")
    return _fn


for _n, _op in (("Erosion", cv2.MORPH_ERODE), ("Dilation", cv2.MORPH_DILATE),
                ("Opening", cv2.MORPH_OPEN), ("Closing", cv2.MORPH_CLOSE),
                ("Morphological Gradient", cv2.MORPH_GRADIENT),
                ("Top Hat", cv2.MORPH_TOPHAT), ("Black Hat", cv2.MORPH_BLACKHAT)):
    _make_morph(_n, _op)


# --------------------------------------------------------------------------------------
# 5.7 SEGMENTATION & CONTOUR
# --------------------------------------------------------------------------------------
CAT = "Segmentation"
_OUT = C("output", "Output", ["Mask", "Segmented Object"])


def _seg_output(img, mask, output):
    return mask if output == "Mask" else cv2.bitwise_and(img, img, mask=mask)


@register(CAT, "Threshold Segmentation", [I("threshold", "Threshold", 127, 0, 255), B("invert", "Invert", False), _OUT])
def threshold_segmentation(img, threshold=127, invert=False, output="Mask", **_):
    t = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY
    _t, mask = cv2.threshold(gray_of(img), threshold, 255, t)
    return _seg_output(img, mask, output)


@register(CAT, "Otsu Segmentation", [C("type", "Threshold Type", ["Binary", "Binary Inverted"]), _OUT])
def otsu_segmentation(img, type="Binary", output="Mask", **_):
    g = cv2.GaussianBlur(gray_of(img), (5, 5), 0)
    _t, mask = cv2.threshold(g, 0, 255, THRESH_TYPES[type] + cv2.THRESH_OTSU)
    return _seg_output(img, mask, output)


@register(CAT, "Watershed", [
    I("marker", "Marker Threshold (% jarak maks.)", 50, 5, 95, tip="Semakin besar, semakin sedikit/ketat marker objek."),
    B("dark_objects", "Objek lebih gelap dari latar", True),
    C("output", "Output", ["Boundaries", "Colored Regions"]),
])
def watershed(img, marker=50, dark_objects=True, output="Boundaries", **_):
    g = cv2.GaussianBlur(gray_of(img), (5, 5), 0)
    t = cv2.THRESH_BINARY_INV if dark_objects else cv2.THRESH_BINARY
    _t, bw = cv2.threshold(g, 0, 255, t + cv2.THRESH_OTSU)
    k = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(bw, cv2.MORPH_OPEN, k, iterations=2)
    sure_bg = cv2.dilate(opening, k, iterations=3)
    dist = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
    _t, sure_fg = cv2.threshold(dist, marker / 100.0 * dist.max(), 255, 0)
    sure_fg = sure_fg.astype(np.uint8)
    unknown = cv2.subtract(sure_bg, sure_fg)
    _n, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0
    markers = cv2.watershed(img.copy(), markers.astype(np.int32))
    out = img.copy()
    if output == "Colored Regions":
        out = np.zeros_like(img)
        for lbl in np.unique(markers):
            if lbl <= 1:
                continue
            hsv = np.uint8([[[(lbl * 37) % 180, 200, 255]]])
            out[markers == lbl] = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0, 0]
        out = cv2.addWeighted(img, 0.35, out, 0.65, 0)
    out[markers == -1] = (0, 0, 255)
    return out


_RETR = {"External": cv2.RETR_EXTERNAL, "List": cv2.RETR_LIST, "Tree": cv2.RETR_TREE, "CComp": cv2.RETR_CCOMP}
_APPROX = {"None": cv2.CHAIN_APPROX_NONE, "Simple": cv2.CHAIN_APPROX_SIMPLE,
           "TC89 L1": cv2.CHAIN_APPROX_TC89_L1, "TC89 KCOS": cv2.CHAIN_APPROX_TC89_KCOS}


def _binary_for_objects(img, source, invert):
    g = gray_of(img)
    if source == "Canny Edges":
        return cv2.Canny(cv2.GaussianBlur(g, (5, 5), 0), 50, 150)
    g = cv2.GaussianBlur(g, (5, 5), 0)
    t = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY
    _t, bw = cv2.threshold(g, 0, 255, t + cv2.THRESH_OTSU)
    return bw


@register(CAT, "Contour Detection", [
    C("retrieval", "Retrieval Mode", list(_RETR)),
    C("approximation", "Approximation", list(_APPROX)),
    C("source", "Binary Source", ["Otsu Threshold", "Canny Edges"]),
    B("invert", "Invert (objek gelap)", False),
    I("min_area", "Min Area (px)", 50, 0, 100000),
    B("bbox", "Tampilkan Bounding Box", False),
])
def contour_detection(img, retrieval="External", approximation="Simple", source="Otsu Threshold",
                      invert=False, min_area=50, bbox=False, **_):
    bw = _binary_for_objects(img, source, invert)
    cnts, _h = cv2.findContours(bw, _RETR[retrieval], _APPROX[approximation])
    cnts = [c for c in cnts if cv2.contourArea(c) >= min_area]
    out = img.copy()
    cv2.drawContours(out, cnts, -1, (0, 255, 0), 2)
    if bbox:
        for c in cnts:
            x, y, w, h = cv2.boundingRect(c)
            cv2.rectangle(out, (x, y), (x + w, y + h), (255, 160, 0), 1)
    cv2.putText(out, f"Contours: {len(cnts)}", (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4, cv2.LINE_AA)
    cv2.putText(out, f"Contours: {len(cnts)}", (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
    return out


@register(CAT, "Connected Components", [
    C("connectivity", "Connectivity", ["8", "4"]),
    B("invert", "Invert (objek gelap)", False),
    I("min_area", "Min Area (px)", 20, 0, 100000),
])
def connected_components(img, connectivity="8", invert=False, min_area=20, **_):
    bw = _binary_for_objects(img, "Otsu Threshold", invert)
    n, labels, stats, _c = cv2.connectedComponentsWithStats(bw, connectivity=int(connectivity))
    out = np.zeros_like(img)
    kept = 0
    for lbl in range(1, n):
        if stats[lbl, cv2.CC_STAT_AREA] < min_area:
            continue
        kept += 1
        hsv = np.uint8([[[(lbl * 37) % 180, 220, 255]]])
        out[labels == lbl] = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0, 0]
    cv2.putText(out, f"Components: {kept}", (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
    return out


@register(CAT, "Masking", [
    I("h_min", "Hue Min", 0, 0, 179), I("h_max", "Hue Max", 179, 0, 179),
    I("s_min", "Saturation Min", 0, 0, 255), I("s_max", "Saturation Max", 255, 0, 255),
    I("v_min", "Value Min", 0, 0, 255), I("v_max", "Value Max", 255, 0, 255),
    B("invert", "Invert Mask", False),
    C("output", "Output", ["Masked Image", "Mask"]),
])
def masking(img, h_min=0, h_max=179, s_min=0, s_max=255, v_min=0, v_max=255, invert=False,
            output="Masked Image", **_):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, (h_min, s_min, v_min), (h_max, s_max, v_max))
    if invert:
        mask = cv2.bitwise_not(mask)
    return mask if output == "Mask" else cv2.bitwise_and(img, img, mask=mask)


# --------------------------------------------------------------------------------------
# 5.8 GEOMETRIC TRANSFORMATION
# --------------------------------------------------------------------------------------
CAT = "Transformation"
_INTERP = {"Linear": cv2.INTER_LINEAR, "Nearest": cv2.INTER_NEAREST, "Cubic": cv2.INTER_CUBIC, "Area": cv2.INTER_AREA}
_MAX_DIM = 16000


@register(CAT, "Resize", [
    C("mode", "Mode", ["Percent", "Pixels"]),
    I("width", "Width", 100, 1, _MAX_DIM, tip="Percent: persen lebar. Pixels: lebar dalam piksel."),
    I("height", "Height", 100, 1, _MAX_DIM),
    B("keep_aspect", "Pertahankan rasio aspek", True),
    C("interpolation", "Interpolation", list(_INTERP)),
])
def resize(img, mode="Percent", width=100, height=100, keep_aspect=True, interpolation="Linear", **_):
    h, w = img.shape[:2]
    if mode == "Percent":
        nw = w * width / 100.0
        nh = h * (width if keep_aspect else height) / 100.0
    else:
        nw = width
        nh = width * h / w if keep_aspect else height
    nw = int(max(1, min(round(nw), _MAX_DIM)))
    nh = int(max(1, min(round(nh), _MAX_DIM)))
    return cv2.resize(img, (nw, nh), interpolation=_INTERP[interpolation])


@register(CAT, "Rotate", [
    F("angle", "Angle (derajat, + = berlawanan jarum jam)", 0.0, -180.0, 180.0, 1.0),
    B("expand", "Perluas kanvas agar tidak terpotong", True),
    C("background", "Background", ["Black", "White"]),
])
def rotate(img, angle=0.0, expand=True, background="Black", **_):
    h, w = img.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), angle, 1.0)
    nw, nh = w, h
    if expand:
        cos, sin = abs(m[0, 0]), abs(m[0, 1])
        nw, nh = int(h * sin + w * cos), int(h * cos + w * sin)
        m[0, 2] += nw / 2.0 - w / 2.0
        m[1, 2] += nh / 2.0 - h / 2.0
    val = (255, 255, 255) if background == "White" else (0, 0, 0)
    return cv2.warpAffine(img, m, (nw, nh), borderValue=val)


@register(CAT, "Flip Horizontal")
def flip_h(img, **_):
    return cv2.flip(img, 1)


@register(CAT, "Flip Vertical")
def flip_v(img, **_):
    return cv2.flip(img, 0)


@register(CAT, "Crop", [
    I("x", "X", 0, 0, 20000), I("y", "Y", 0, 0, 20000),
    I("width", "Width (0 = sampai tepi)", 0, 0, 20000),
    I("height", "Height (0 = sampai tepi)", 0, 0, 20000),
])
def crop(img, x=0, y=0, width=0, height=0, **_):
    h, w = img.shape[:2]
    if x >= w or y >= h:
        raise ValueError(f"Area crop di luar gambar ({w}x{h}).")
    x2 = w if width == 0 else min(w, x + width)
    y2 = h if height == 0 else min(h, y + height)
    return img[y:y2, x:x2].copy()


@register(CAT, "Translation", [I("tx", "X (piksel)", 0, -5000, 5000), I("ty", "Y (piksel)", 0, -5000, 5000)])
def translation(img, tx=0, ty=0, **_):
    h, w = img.shape[:2]
    m = np.float32([[1, 0, tx], [0, 1, ty]])
    return cv2.warpAffine(img, m, (w, h))


@register(CAT, "Affine Transformation", [
    F("a", "a (scale/rot X)", 1.0, -3.0, 3.0, 0.05), F("b", "b (shear X)", 0.0, -3.0, 3.0, 0.05),
    F("c", "c (shear Y)", 0.0, -3.0, 3.0, 0.05), F("d", "d (scale/rot Y)", 1.0, -3.0, 3.0, 0.05),
    I("tx", "Tx (piksel)", 0, -5000, 5000), I("ty", "Ty (piksel)", 0, -5000, 5000),
])
def affine(img, a=1.0, b=0.0, c=0.0, d=1.0, tx=0, ty=0, **_):
    h, w = img.shape[:2]
    m = np.float32([[a, b, tx], [c, d, ty]])
    return cv2.warpAffine(img, m, (w, h))


@register(CAT, "Perspective Transformation", [
    F("tl_x", "Top-Left X (%)", 0.0, -50.0, 50.0, 1.0), F("tl_y", "Top-Left Y (%)", 0.0, -50.0, 50.0, 1.0),
    F("tr_x", "Top-Right X (%)", 0.0, -50.0, 50.0, 1.0), F("tr_y", "Top-Right Y (%)", 0.0, -50.0, 50.0, 1.0),
    F("br_x", "Bottom-Right X (%)", 0.0, -50.0, 50.0, 1.0), F("br_y", "Bottom-Right Y (%)", 0.0, -50.0, 50.0, 1.0),
    F("bl_x", "Bottom-Left X (%)", 0.0, -50.0, 50.0, 1.0), F("bl_y", "Bottom-Left Y (%)", 0.0, -50.0, 50.0, 1.0),
])
def perspective(img, tl_x=0.0, tl_y=0.0, tr_x=0.0, tr_y=0.0, br_x=0.0, br_y=0.0, bl_x=0.0, bl_y=0.0, **_):
    """Titik tujuan = sudut gambar digeser sebesar persentase tertentu."""
    h, w = img.shape[:2]
    src = np.float32([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]])
    off = np.float32([[tl_x, tl_y], [tr_x, tr_y], [br_x, br_y], [bl_x, bl_y]]) / 100.0
    dst = src + off * np.float32([w, h])
    m = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, m, (w, h))


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
