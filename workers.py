"""Pixora - Worker thread (pemrosesan, kamera, batch) agar GUI tidak freeze."""
from __future__ import annotations

import os
import sys
import time
import traceback

os.environ.setdefault("OPENCV_LOG_LEVEL", "SILENT")  # jika workers diimpor lebih dulu dari main
import cv2
from PySide6.QtCore import QThread, Signal

import processing as P
from fileio import read_image, unique_path, write_image

CANCELLED = "__cancelled__"


class TaskWorker(QThread):
    """Jalankan fungsi `fn(cancel)` di thread terpisah."""

    succeeded = Signal(object)
    failed = Signal(str)

    def __init__(self, fn, parent=None):
        super().__init__(parent)
        self._fn = fn
        self._cancel = False

    def cancel(self):
        self._cancel = True

    def is_cancelled(self) -> bool:
        return self._cancel

    def run(self):
        try:
            result = self._fn(self.is_cancelled)
        except InterruptedError:
            self.failed.emit(CANCELLED)
            return
        except Exception as e:  # noqa: BLE001 - semua kegagalan dilaporkan ke UI
            traceback.print_exc()
            self.failed.emit(f"{type(e).__name__}: {e}")
            return
        if self._cancel:
            self.failed.emit(CANCELLED)
        else:
            self.succeeded.emit(result)


def detect_cameras(max_index: int = 6) -> list:
    """Cari indeks kamera yang bisa dibuka. (OpenCV tidak memberi nama perangkat.)"""
    backend = cv2.CAP_DSHOW if sys.platform.startswith("win") else cv2.CAP_ANY
    found = []
    for i in range(max_index):
        cap = cv2.VideoCapture(i, backend)
        if cap.isOpened():
            found.append(i)
        cap.release()
    return found


class CameraThread(QThread):
    """Frame capture terpisah. Pemrosesan live hanya berjalan setelah `set_processing` (tombol Apply)."""

    frame = Signal(object, object)  # (frame asli BGR, frame hasil BGR atau None)
    error = Signal(str)
    opened = Signal(int, int)

    def __init__(self, index: int, resolution=None, parent=None):
        super().__init__(parent)
        self.index = index
        self.resolution = resolution  # (w, h) atau None
        self._running = True
        self._spec = None  # (method_id, params, fps)

    def set_processing(self, method_id=None, params=None, fps: int = 15):
        self._spec = None if method_id is None else (method_id, dict(params or {}), max(1, int(fps)))

    @property
    def processing(self) -> bool:
        return self._spec is not None

    def run(self):
        backend = cv2.CAP_DSHOW if sys.platform.startswith("win") else cv2.CAP_ANY
        cap = cv2.VideoCapture(self.index, backend)
        if not cap.isOpened():
            self.error.emit(f"Kamera {self.index} tidak dapat dibuka (mungkin dipakai aplikasi lain).")
            return
        if self.resolution:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        self.opened.emit(int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
        last_proc = 0.0
        fails = 0
        while self._running:
            ok, f = cap.read()
            if not ok:
                fails += 1
                if fails > 30:
                    self.error.emit("Kamera berhenti mengirim frame.")
                    break
                time.sleep(0.03)
                continue
            fails = 0
            proc = None
            spec = self._spec
            if spec is not None:
                mid, params, fps = spec
                now = time.time()
                if now - last_proc >= 1.0 / fps:
                    try:
                        proc = P.run_method(mid, f, params)
                    except Exception as e:  # noqa: BLE001
                        self._spec = None
                        self.error.emit(f"Live processing dihentikan: {e}")
                    last_proc = time.time()
            self.frame.emit(f, proc)
        cap.release()

    def stop(self):
        self._running = False
        self._spec = None
        self.wait(3000)


class BatchWorker(QThread):
    progress = Signal(int, int, str, bool, str)  # index, total, filename, ok, pesan
    done = Signal(object)  # ringkasan

    def __init__(self, files, steps, out_dir, ext=".png", quality=95, suffix="_processed", parent=None):
        super().__init__(parent)
        self.files, self.steps, self.out_dir = list(files), list(steps), out_dir
        self.ext, self.quality, self.suffix = ext, quality, suffix
        self._cancel = False

    def cancel(self):
        self._cancel = True

    def run(self):
        os.makedirs(self.out_dir, exist_ok=True)
        ok_n, fail = 0, []
        total = len(self.files)
        for i, path in enumerate(self.files, 1):
            if self._cancel:
                break
            name = os.path.basename(path)
            try:
                img, _meta = read_image(path)
                out = P.run_pipeline(img, self.steps, cancel=lambda: self._cancel)
                stem = os.path.splitext(name)[0]
                dest = unique_path(os.path.join(self.out_dir, stem + self.suffix + self.ext))
                write_image(dest, out, self.quality)
                ok_n += 1
                self.progress.emit(i, total, name, True, os.path.basename(dest))
            except InterruptedError:
                break
            except Exception as e:  # noqa: BLE001 - satu gambar gagal tidak menghentikan batch
                fail.append((name, str(e)))
                self.progress.emit(i, total, name, False, str(e))
        self.done.emit({"total": total, "success": ok_n, "failed": fail, "cancelled": self._cancel})
