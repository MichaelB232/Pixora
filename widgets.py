"""Pixora - Widget kustom: ImageView (zoom/pan), ImagePanel, ParamPanel, AnalysisPanel."""
from __future__ import annotations

import os

os.environ.setdefault("QT_API", "pyside6")

from PySide6.QtCore import QSize, Qt, Signal
from PySide6.QtGui import QColor, QImage, QPainter, QPixmap
from PySide6.QtWidgets import (
    QCheckBox, QComboBox, QDoubleSpinBox, QFrame, QGraphicsScene, QGraphicsView, QHBoxLayout,
    QLabel, QPlainTextEdit, QPushButton, QScrollArea, QSlider, QSpinBox, QStackedWidget,
    QToolButton, QVBoxLayout, QWidget,
)
import cv2
import numpy as np

import matplotlib

matplotlib.use("QtAgg")
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg  # noqa: E402
from matplotlib.figure import Figure  # noqa: E402
from matplotlib.patches import Polygon  # noqa: E402


def to_qimage(bgr: np.ndarray) -> QImage:
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w = rgb.shape[:2]
    return QImage(rgb.data, w, h, 3 * w, QImage.Format_RGB888).copy()


# ======================================================================================
# ImageView
# ======================================================================================
class ImageView(QGraphicsView):
    viewChanged = Signal()
    zoomChanged = Signal(float)  # persen
    pixelHovered = Signal(int, int)
    fileDropped = Signal(str)

    MIN_ZOOM, MAX_ZOOM = 0.02, 64.0

    def __init__(self, placeholder: str = "", accept_drops: bool = False, parent=None):
        scene = QGraphicsScene()
        super().__init__(scene, parent)
        self._scene = scene  # simpan referensi agar tidak di-garbage-collect
        self._item = None
        self._placeholder = placeholder
        self._accept_drops = accept_drops
        self._fit = True
        self._syncing = False
        self.setDragMode(QGraphicsView.ScrollHandDrag)
        self.setTransformationAnchor(QGraphicsView.AnchorUnderMouse)
        self.setResizeAnchor(QGraphicsView.AnchorViewCenter)
        self.setMouseTracking(True)
        self.setAcceptDrops(accept_drops)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.horizontalScrollBar().valueChanged.connect(self._emit_view)
        self.verticalScrollBar().valueChanged.connect(self._emit_view)

    # -- konten ----------------------------------------------------------------------------
    def has_image(self) -> bool:
        return self._item is not None

    def image_size(self):
        return (0, 0) if self._item is None else (self._item.pixmap().width(), self._item.pixmap().height())

    def set_placeholder(self, text: str):
        self._placeholder = text
        self.viewport().update()

    def set_image(self, img, refit: bool = False):
        """Tampilkan gambar BGR (atau None untuk placeholder). Zoom dipertahankan kecuali refit."""
        if img is None:
            self.scene().clear()
            self._item = None
            self.resetTransform()
            self._fit = True
            self.viewport().update()
            self.zoomChanged.emit(0.0)
            return
        pm = QPixmap.fromImage(to_qimage(img))
        new = self._item is None
        resized = (not new) and pm.size() != self._item.pixmap().size()
        if new:
            self._item = self.scene().addPixmap(pm)
        else:
            self._item.setPixmap(pm)
        self.scene().setSceneRect(self._item.boundingRect())
        if new or refit or resized:
            self.fit()  # gambar baru / ukuran berubah; frame kamera berukuran sama tidak memicu fit ulang

    # -- zoom / pan ------------------------------------------------------------------------
    def zoom_percent(self) -> float:
        return 0.0 if self._item is None else self.transform().m11() * 100.0

    def fit(self):
        if self._item is None:
            return
        self._fit = True
        self.resetTransform()
        self.fitInView(self._item, Qt.KeepAspectRatio)
        self._after_zoom()

    def actual_size(self):
        if self._item is None:
            return
        self._fit = False
        self.resetTransform()
        self._after_zoom()

    def zoom(self, factor: float):
        if self._item is None:
            return
        self._fit = False
        cur = self.transform().m11()
        new = min(self.MAX_ZOOM, max(self.MIN_ZOOM, cur * factor))
        if abs(new - cur) > 1e-9:
            self.scale(new / cur, new / cur)
        self._after_zoom()

    def _after_zoom(self):
        if self._item is not None:
            mode = Qt.SmoothTransformation if self.transform().m11() < 1.5 else Qt.FastTransformation
            self._item.setTransformationMode(mode)
        self.zoomChanged.emit(self.zoom_percent())
        self._emit_view()

    def _emit_view(self, *_):
        if not self._syncing:
            self.viewChanged.emit()

    def fit_scale(self) -> float:
        r = self._item.boundingRect()
        vp = self.viewport().size()
        return max(1e-6, min(vp.width() / r.width(), vp.height() / r.height()))

    def view_state(self):
        """(skala, pusat ternormalisasi x/y, mode fit, lebar gambar) untuk sinkronisasi antar-view."""
        try:
            if self._item is None:
                return None
            r = self._item.boundingRect()
            c = self.mapToScene(self.viewport().rect().center())
            return (self.transform().m11(), c.x() / r.width(), c.y() / r.height(), self._fit, r.width())
        except RuntimeError:  # objek Qt sudah dihapus saat aplikasi ditutup
            return None

    def apply_state(self, state):
        try:
            if state is None or self._item is None:
                return
            scale, cx, cy, fit, src_w = state
            self._syncing = True
            try:
                if fit:
                    self.fit()
                else:
                    r = self._item.boundingRect()
                    # skala absolut sama jika ukuran gambar sama; proporsional jika berbeda (mis. hasil crop/resize)
                    s = min(self.MAX_ZOOM, max(self.MIN_ZOOM, scale * src_w / r.width()))
                    self._fit = False
                    self.resetTransform()
                    self.scale(s, s)
                    self.centerOn(cx * r.width(), cy * r.height())
                    self._after_zoom()
            finally:
                self._syncing = False
        except RuntimeError:
            pass

    # -- event -------------------------------------------------------------------------------
    def wheelEvent(self, e):
        if self._item is None:
            return
        self.zoom(1.15 ** (e.angleDelta().y() / 120.0))
        e.accept()

    def resizeEvent(self, e):
        super().resizeEvent(e)
        if self._fit and self._item is not None:
            self.fit()

    def mouseMoveEvent(self, e):
        super().mouseMoveEvent(e)
        if self._item is not None:
            p = self.mapToScene(e.position().toPoint())
            x, y = int(p.x()), int(p.y())
            w, h = self.image_size()
            if 0 <= x < w and 0 <= y < h:
                self.pixelHovered.emit(x, y)

    def drawForeground(self, painter: QPainter, rect):
        if self._item is None and self._placeholder:
            painter.resetTransform()
            painter.setPen(QColor(self.palette().placeholderText().color()))
            painter.drawText(self.viewport().rect().adjusted(20, 20, -20, -20),
                             Qt.AlignCenter | Qt.TextWordWrap, self._placeholder)

    def dragEnterEvent(self, e):
        if self._accept_drops and e.mimeData().hasUrls():
            e.acceptProposedAction()
        else:
            super().dragEnterEvent(e)

    def dragMoveEvent(self, e):
        if self._accept_drops and e.mimeData().hasUrls():
            e.acceptProposedAction()
        else:
            super().dragMoveEvent(e)

    def dropEvent(self, e):
        urls = e.mimeData().urls()
        if self._accept_drops and urls:
            self.fileDropped.emit(urls[0].toLocalFile())
            e.acceptProposedAction()
        else:
            super().dropEvent(e)


# ======================================================================================
# ImagePanel
# ======================================================================================
class ImagePanel(QFrame):
    """Panel gambar: judul + tombol zoom + view + baris informasi."""

    def __init__(self, title: str, placeholder: str, accept_drops: bool = False, parent=None):
        super().__init__(parent)
        self.setObjectName("panel")
        lay = QVBoxLayout(self)
        lay.setContentsMargins(10, 8, 10, 8)
        lay.setSpacing(6)

        head = QHBoxLayout()
        self.title = QLabel(title)
        self.title.setObjectName("panelTitle")
        head.addWidget(self.title)
        head.addStretch(1)
        self.tools = QHBoxLayout()
        self.tools.setSpacing(4)
        head.addLayout(self.tools)
        lay.addLayout(head)

        self.view = ImageView(placeholder, accept_drops)
        lay.addWidget(self.view, 1)
        self.info = QLabel("-")
        self.info.setObjectName("info")
        self.info.setWordWrap(True)
        lay.addWidget(self.info)

        self.btn_out = self.add_button("−", lambda: self.view.zoom(1 / 1.25), "Zoom Out")
        self.btn_in = self.add_button("+", lambda: self.view.zoom(1.25), "Zoom In")
        self.btn_fit = self.add_button("Fit", self.view.fit, "Fit to Screen")
        self.btn_100 = self.add_button("1:1", self.view.actual_size, "Ukuran asli (100%)")

    def add_button(self, text: str, slot, tip: str = "", checkable: bool = False, first: bool = False) -> QPushButton:
        b = QPushButton(text)
        b.setToolTip(tip)
        b.setCheckable(checkable)
        if checkable:
            b.toggled.connect(slot)
        else:
            b.clicked.connect(lambda _=False, s=slot: s())
        if first:
            self.tools.insertWidget(0, b)
        else:
            self.tools.addWidget(b)
        return b

    def set_info(self, text: str):
        self.info.setText(text)


# ======================================================================================
# ParamPanel - kontrol parameter dinamis
# ======================================================================================
class ParamPanel(QScrollArea):
    changed = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWidgetResizable(True)
        self._inner = QWidget()
        self._lay = QVBoxLayout(self._inner)
        self._lay.setContentsMargins(4, 6, 4, 6)
        self._lay.setSpacing(4)
        self.setWidget(self._inner)
        self._getters, self._setters, self._defaults = {}, {}, {}
        self._method = None

    def clear(self):
        while self._lay.count():
            it = self._lay.takeAt(0)
            w = it.widget()
            if w is not None:
                w.setParent(None)  # lepas segera agar tidak tampil tumpang tindih
                w.deleteLater()
        self._getters.clear()
        self._setters.clear()
        self._defaults.clear()

    def set_method(self, method):
        self.clear()
        self._method = method
        if method is None or not method.params:
            lbl = QLabel("Metode ini tidak memiliki parameter.\nTekan Apply untuk menjalankannya.")
            lbl.setObjectName("muted")
            lbl.setWordWrap(True)
            self._lay.addWidget(lbl)
        else:
            for p in method.params:
                self._add(p)
        self._lay.addStretch(1)

    def values(self) -> dict:
        return {k: g() for k, g in self._getters.items()}

    def reset(self):
        """Kembalikan parameter ke nilai default (tidak menjalankan pemrosesan)."""
        for k, s in self._setters.items():
            s(self._defaults[k])

    # -- pembuat kontrol ---------------------------------------------------------------------
    def _label(self, p):
        l = QLabel(p.label)
        l.setObjectName("muted")
        l.setWordWrap(True)
        if p.tip:
            l.setToolTip(p.tip)
        self._lay.addSpacing(4)
        self._lay.addWidget(l)

    def _register(self, p, getter, setter):
        self._getters[p.key], self._setters[p.key], self._defaults[p.key] = getter, setter, p.default

    def _add(self, p):
        if p.kind == "bool":
            cb = QCheckBox(p.label)
            cb.setChecked(bool(p.default))
            cb.setToolTip(p.tip)
            cb.toggled.connect(lambda _=None: self.changed.emit())
            self._lay.addSpacing(4)
            self._lay.addWidget(cb)
            self._register(p, cb.isChecked, cb.setChecked)
            return
        self._label(p)
        if p.kind == "choice":
            cb = QComboBox()
            cb.addItems([str(c) for c in p.choices])
            cb.setCurrentText(str(p.default))
            cb.currentTextChanged.connect(lambda _=None: self.changed.emit())
            self._lay.addWidget(cb)
            self._register(p, cb.currentText, lambda v, c=cb: c.setCurrentText(str(v)))
        elif p.kind == "int":
            self._add_number(p, QSpinBox(), is_float=False)
        else:
            self._add_number(p, QDoubleSpinBox(), is_float=True)

    def _add_number(self, p, spin, is_float: bool):
        row = QHBoxLayout()
        row.setSpacing(8)
        lo, hi, step = p.minimum, p.maximum, p.step
        spin.setRange(lo, hi)
        if is_float:
            spin.setDecimals(2 if step < 0.1 else 1)
            spin.setSingleStep(step)
        else:
            spin.setSingleStep(2 if p.odd else int(step))
        spin.setValue(p.default)
        spin.setMinimumWidth(78)
        n_steps = int(round((hi - lo) / step))
        slider = None
        if n_steps <= 2000:
            slider = QSlider(Qt.Horizontal)
            slider.setRange(0, n_steps)
            slider.setValue(int(round((p.default - lo) / step)))
            row.addWidget(slider, 1)
        row.addWidget(spin)
        wrap = QWidget()
        wrap.setLayout(row)
        row.setContentsMargins(0, 0, 0, 0)
        self._lay.addWidget(wrap)

        def fix_odd(v):
            if p.odd and int(v) % 2 == 0:
                spin.blockSignals(True)
                spin.setValue(int(v) + 1 if int(v) + 1 <= hi else int(v) - 1)
                spin.blockSignals(False)

        def spin_changed(v):
            if not is_float:
                fix_odd(v)
            if slider is not None:
                slider.blockSignals(True)
                slider.setValue(int(round((spin.value() - lo) / step)))
                slider.blockSignals(False)
            self.changed.emit()

        def slider_changed(i):
            v = lo + i * step
            spin.blockSignals(True)
            spin.setValue(round(v, 2) if is_float else int(round(v)))
            spin.blockSignals(False)
            if not is_float:
                fix_odd(spin.value())
            self.changed.emit()

        spin.valueChanged.connect(spin_changed)
        if slider is not None:
            slider.valueChanged.connect(slider_changed)

        def setter(v):
            spin.setValue(v)  # memicu spin_changed -> sinkron slider

        self._register(p, spin.value, setter)


# ======================================================================================
# AnalysisPanel - histogram, statistik, pixel inspector
# ======================================================================================
class AnalysisPanel(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.inspector_active = False
        self._last = None
        self._dark = True
        self._c = dict(bg="#1e2127", fg="#e7e9ee", grid="#343944")
        self._ax = None
        self._lines = []
        self._fills = []
        self._verts = []
        self._plot_key = None
        self._x = np.arange(256, dtype=np.float32)

        lay = QVBoxLayout(self)
        lay.setContentsMargins(6, 6, 6, 6)
        self.title = QLabel("Analysis")
        self.title.setObjectName("panelTitle")
        lay.addWidget(self.title)
        self.stack = QStackedWidget()
        lay.addWidget(self.stack, 1)

        self.hint = QLabel("Pilih Grayscale Histogram atau RGB Histogram di kategori Histogram.\nHistogram dihitung otomatis dan tidak mengubah gambar.")
        self.hint.setObjectName("muted")
        self.hint.setAlignment(Qt.AlignCenter)
        self.stack.addWidget(self.hint)

        self.fig = Figure(figsize=(6, 2.4), dpi=100)
        self.canvas = FigureCanvasQTAgg(self.fig)
        self.stack.addWidget(self.canvas)

        self.text = QPlainTextEdit()
        self.text.setReadOnly(True)
        font = self.text.font()
        font.setFamily("Consolas")
        font.setStyleHint(font.StyleHint.Monospace)
        self.text.setFont(font)
        self.stack.addWidget(self.text)

    def set_theme(self, dark: bool, colors: dict):
        self._dark = dark
        self._c = dict(bg=colors["surface"], fg=colors["text"], grid=colors["border"])
        if self._last and self._last.get("type") == "histogram":
            self.show_result(self._last)

    def show_hint(self, text: str):
        self._last = None
        self.inspector_active = False
        self.hint.setText(text)
        self.stack.setCurrentWidget(self.hint)

    def show_result(self, res: dict):
        self._last = res
        t = res.get("type")
        self.title.setText(res.get("title", "Analysis"))
        self.inspector_active = t == "inspector"
        if t == "histogram":
            self._plot(res)
            self.stack.setCurrentWidget(self.canvas)
        elif t == "text":
            self.text.setPlainText(res["text"])
            self.stack.setCurrentWidget(self.text)
        elif t == "inspector":
            self.text.setPlainText("Pixel Inspector aktif.\nArahkan kursor ke gambar asli atau gambar hasil untuk melihat nilai piksel.")
            self.stack.setCurrentWidget(self.text)

    def _plot(self, res):
        c = self._c
        series = res["series"]
        key = (self._dark, c["bg"], c["fg"], c["grid"], tuple((name, color) for name, _, color in series))
        if key != self._plot_key or self._ax is None:
            self.fig.clear()
            self.fig.set_facecolor(c["bg"])
            ax = self.fig.add_subplot(111)
            ax.set_facecolor(c["bg"])
            self._ax = ax
            self._lines = []
            self._fills = []
            self._verts = []
            for name, counts, color in series:
                verts = np.zeros((258, 2), dtype=np.float32)
                verts[1:257, 0] = self._x
                verts[1:257, 1] = counts
                verts[257, 0] = 255.0
                poly = Polygon(verts, closed=True, facecolor=color, edgecolor="none", alpha=0.35)
                ax.add_patch(poly)
                (line,) = ax.plot(self._x, counts, color=color, linewidth=1.1, label=name)
                self._verts.append(verts)
                self._fills.append(poly)
                self._lines.append(line)
            ax.set_xlim(0, 255)
            ax.set_xlabel("Intensitas", color=c["fg"], fontsize=8)
            ax.set_ylabel("Jumlah piksel", color=c["fg"], fontsize=8)
            ax.tick_params(colors=c["fg"], labelsize=8)
            ax.grid(True, color=c["grid"], linewidth=0.5, alpha=0.7)
            for s in ax.spines.values():
                s.set_color(c["grid"])
            if len(series) > 1:
                leg = ax.legend(fontsize=8, facecolor=c["bg"], edgecolor=c["grid"])
                for t in leg.get_texts():
                    t.set_color(c["fg"])
            max_y = max((float(np.max(cnt)) for _, cnt, _ in series), default=0.0)
            ax.set_ylim(0, max(1.0, max_y * 1.08))
            self.fig.tight_layout()
            self._plot_key = key
        else:
            max_y = 0.0
            for idx, (_name, counts, _color) in enumerate(series):
                self._lines[idx].set_ydata(counts)
                self._verts[idx][1:257, 1] = counts
                self._fills[idx].set_xy(self._verts[idx])
                m = float(np.max(counts))
                if m > max_y:
                    max_y = m
            self._ax.set_ylim(0, max(1.0, max_y * 1.08))
        self.canvas.draw_idle()

    def update_pixel(self, which: str, x: int, y: int, bgr_img: np.ndarray):
        if not self.inspector_active or bgr_img is None:
            return
        h, w = bgr_img.shape[:2]
        if not (0 <= x < w and 0 <= y < h):
            return
        b, g, r = (int(v) for v in bgr_img[y, x])
        gray = int(round(0.299 * r + 0.587 * g + 0.114 * b))
        hsv = cv2.cvtColor(np.uint8([[[b, g, r]]]), cv2.COLOR_BGR2HSV)[0, 0]
        self.text.setPlainText(
            f"Sumber   : {which}\nPosisi   : x={x}, y={y}\n"
            f"RGB      : ({r}, {g}, {b})   #{r:02X}{g:02X}{b:02X}\n"
            f"Gray     : {gray}\nHSV      : H={int(hsv[0]) * 2}°  S={int(hsv[1])}  V={int(hsv[2])}"
        )
        self.stack.setCurrentWidget(self.text)