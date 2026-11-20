"""Tes regresi algoritma Pixora.

OpenCV dipakai hanya sebagai pembanding (oracle); algoritma di `algorithms/` murni NumPy.
Jalankan:  python -m pytest tests -q     (atau: python tests/test_algorithms.py)
"""
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import processing as P  # noqa: E402
from algorithms import (  # noqa: E402
    apply_binary_threshold, apply_brightness, apply_contrast, apply_equalization,
    apply_grayscale, apply_negative, apply_otsu_threshold,
)


def _scene():
    rng = np.random.default_rng(1)
    img = cv2.GaussianBlur(rng.integers(0, 255, (180, 240, 3), dtype=np.uint8), (0, 0), 2)
    cv2.circle(img, (80, 90), 40, (230, 230, 40), -1)
    cv2.rectangle(img, (140, 40), (220, 140), (30, 200, 30), -1)
    return img


IMG = _scene()
GRAY = cv2.cvtColor(IMG, cv2.COLOR_BGR2GRAY)


def _maxdiff(a, b):
    return int(np.abs(a.astype(int) - b.astype(int)).max())


def test_point_operations_exact():
    assert _maxdiff(apply_negative(IMG), 255 - IMG) == 0
    assert _maxdiff(apply_brightness(IMG, 40), np.clip(IMG.astype(int) + 40, 0, 255)) == 0
    assert _maxdiff(apply_binary_threshold(IMG, 127), cv2.threshold(GRAY, 127, 255, cv2.THRESH_BINARY)[1]) == 0
    ref = cv2.threshold(GRAY, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    assert _maxdiff(apply_otsu_threshold(IMG), ref) == 0
    assert _maxdiff(apply_grayscale(IMG), GRAY) <= 1
    ref = np.clip((IMG.astype(float) - 128) * 1.5 + 128 + 0.5, 0, 255).astype(np.uint8)
    assert _maxdiff(apply_contrast(IMG, 150), ref) == 0


def test_equalization_close_to_opencv():
    d = np.abs(apply_equalization(IMG, "Grayscale").astype(int) - cv2.equalizeHist(GRAY).astype(int))
    assert (d > 0).mean() < 0.01


def test_all_registered_methods_run_and_keep_input():
    before = IMG.copy()
    for mid, m in P.METHODS.items():
        out = P.run_method(mid, IMG, m.defaults())
        if m.kind == "process":
            assert out.dtype == np.uint8 and out.ndim == 3 and out.shape[:2] == IMG.shape[:2], mid
        else:
            assert out["type"] == "histogram", mid
    assert np.array_equal(IMG, before)


def test_pipeline_runs_in_order():
    steps = [P.PipelineStep("Basic Processing/Grayscale"), P.PipelineStep("Filtering/Blur", {"ksize": 5}),
             P.PipelineStep("Basic Processing/Binary Threshold", {"threshold": 100}),
             P.PipelineStep("Basic Processing/Negative", enabled=False)]
    out = P.run_pipeline(IMG, steps)
    assert set(np.unique(out)) <= {0, 255}


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print("ok", t.__name__)
