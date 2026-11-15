"""Pixel Lab - File management (baca/tulis gambar, aman untuk path Unicode di Windows)."""
from __future__ import annotations

import os
from typing import Tuple

import cv2
import numpy as np

SUPPORTED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}
OUTPUT_FORMATS = {
    "PNG": ".png", "JPG / JPEG": ".jpg", "BMP": ".bmp", "TIFF": ".tiff", "WEBP": ".webp",
}
OPEN_FILTER = "Images (*.jpg *.jpeg *.png *.bmp *.tif *.tiff *.webp);;All files (*)"


def is_supported(path: str) -> bool:
    return os.path.splitext(path)[1].lower() in SUPPORTED_EXT


def _to_u8(img: np.ndarray) -> np.ndarray:
    if img.dtype == np.uint8:
        return img
    if img.dtype == np.uint16:
        return (img / 257.0).astype(np.uint8)
    return cv2.normalize(img.astype(np.float32), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def read_image(path: str) -> Tuple[np.ndarray, dict]:
    """Baca gambar menjadi BGR uint8. Mengembalikan (gambar, metadata)."""
    ext = os.path.splitext(path)[1].lower()
    if ext not in SUPPORTED_EXT:
        raise ValueError(f"Format '{ext or '?'}' tidak didukung. Gunakan JPG, PNG, BMP, TIFF, atau WEBP.")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"File tidak ditemukan: {path}")
    try:
        data = np.fromfile(path, np.uint8)
    except OSError as e:
        raise IOError(f"File tidak dapat dibaca: {e}")
    img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED) if data.size else None
    if img is None:  # fallback Pillow
        try:
            from PIL import Image

            with Image.open(path) as im:
                im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
                arr = np.array(im)
            img = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA if arr.shape[2] == 4 else cv2.COLOR_RGB2BGR)
        except Exception:
            raise ValueError("File rusak atau tidak dapat dibaca sebagai gambar.")
    bits = img.dtype.itemsize * 8
    ch = 1 if img.ndim == 2 else img.shape[2]
    img = _to_u8(img)
    if img.ndim == 2:
        mode, bgr = "Grayscale", cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif ch == 4:
        a = img[..., 3:4].astype(np.float32) / 255.0  # komposit di atas putih
        bgr = np.clip(img[..., :3] * a + 255 * (1 - a), 0, 255).astype(np.uint8)
        mode = "RGBA"
    else:
        mode, bgr = "RGB", img
    meta = {
        "name": os.path.basename(path),
        "path": path,
        "format": ext.lstrip(".").upper().replace("JPEG", "JPG").replace("TIF", "TIFF").replace("TIFFF", "TIFF"),
        "width": bgr.shape[1],
        "height": bgr.shape[0],
        "channels": ch,
        "bit_depth": bits,
        "mode": mode,
        "size_bytes": os.path.getsize(path),
    }
    return np.ascontiguousarray(bgr), meta


def write_image(path: str, img: np.ndarray, quality: int = 95) -> None:
    """Tulis gambar; melempar IOError jika gagal / file tidak terverifikasi."""
    ext = os.path.splitext(path)[1].lower()
    if ext not in SUPPORTED_EXT:
        raise ValueError(f"Format output '{ext}' tidak didukung.")
    params = []
    if ext in (".jpg", ".jpeg"):
        params = [cv2.IMWRITE_JPEG_QUALITY, int(quality)]
    elif ext == ".webp":
        params = [cv2.IMWRITE_WEBP_QUALITY, int(quality)]
    elif ext == ".png":
        params = [cv2.IMWRITE_PNG_COMPRESSION, int(np.clip(round((100 - quality) / 11), 0, 9))]
    ok, buf = cv2.imencode(ext, img, params)
    if not ok:
        raise IOError("Gagal meng-encode gambar.")
    try:
        with open(path, "wb") as f:
            f.write(buf.tobytes())
    except OSError as e:
        raise IOError(f"Gagal menulis file: {e}")
    if not os.path.isfile(path) or os.path.getsize(path) == 0:
        raise IOError("Penulisan file tidak terverifikasi.")


def unique_path(path: str) -> str:
    """Tambahkan _1, _2, ... jika file sudah ada (dipakai batch agar tidak menimpa)."""
    base, ext = os.path.splitext(path)
    n, cand = 0, path
    while os.path.exists(cand):
        n += 1
        cand = f"{base}_{n}{ext}"
    return cand


def human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024.0
    return f"{n} B"


def list_images(folder: str) -> list:
    return sorted(os.path.join(folder, f) for f in os.listdir(folder) if is_supported(f))
