"""Pixora - Processing history (Undo / Redo) dan konversi menjadi pipeline."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import numpy as np

from processing import METHODS, PipelineStep, describe_params

MAX_ENTRIES = 40  # batasi memori: entri tertua dibuang


@dataclass
class HistoryEntry:
    method_id: str
    params: dict
    image: np.ndarray
    base: str = "previous"  # "previous" = diterapkan pada hasil sebelumnya, "original" = pada gambar asli
    status: str = "Completed"
    time: datetime = field(default_factory=datetime.now)
    note: str = ""
    steps: Optional[list] = None  # khusus entri "Pipeline": daftar langkah yang dijalankan ulang

    @property
    def name(self) -> str:
        return METHODS[self.method_id].name if self.method_id in METHODS else self.method_id

    @property
    def param_text(self) -> str:
        if self.note:
            return self.note
        return describe_params(self.method_id, self.params) if self.method_id in METHODS else "-"


class History:
    def __init__(self):
        self.entries: list[HistoryEntry] = []
        self.index = -1  # -1 = belum ada hasil (hanya gambar asli)

    # -- state ---------------------------------------------------------------------------
    def current_image(self) -> Optional[np.ndarray]:
        return self.entries[self.index].image if self.index >= 0 else None

    @property
    def can_undo(self) -> bool:
        return self.index >= 0

    @property
    def can_redo(self) -> bool:
        return self.index < len(self.entries) - 1

    # -- mutasi --------------------------------------------------------------------------
    def push(self, entry: HistoryEntry) -> None:
        del self.entries[self.index + 1:]  # buang cabang redo
        self.entries.append(entry)
        if len(self.entries) > MAX_ENTRIES:
            self.entries.pop(0)
        self.index = len(self.entries) - 1

    def undo(self) -> None:
        if self.can_undo:
            self.index -= 1

    def redo(self) -> None:
        if self.can_redo:
            self.index += 1

    def jump(self, index: int) -> None:
        self.index = max(-1, min(index, len(self.entries) - 1))

    def clear(self) -> None:
        self.entries.clear()
        self.index = -1

    # -- pipeline ------------------------------------------------------------------------
    def to_steps(self) -> list:
        """Rangkaian langkah aktif (sampai posisi saat ini). Operasi 'original' memulai rantai baru."""
        steps: list[PipelineStep] = []
        for e in self.entries[: self.index + 1]:
            if e.steps is not None:  # hasil Run Pipeline menggantikan seluruh rantai
                steps = [PipelineStep(s.method_id, dict(s.params), True) for s in e.steps if s.enabled]
                continue
            if e.method_id not in METHODS or METHODS[e.method_id].kind != "process":
                continue
            if e.base == "original":
                steps = []
            steps.append(PipelineStep(e.method_id, dict(e.params), True))
        return steps
