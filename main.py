"""Pixel Lab - Desktop Image Processing Studio (PySide6 + OpenCV).

Jalankan:  python main.py
"""
from __future__ import annotations

import datetime
import json
import os
import sys

import cv2
from PySide6.QtCore import QSettings, Qt
from PySide6.QtGui import QAction, QActionGroup, QKeySequence
from PySide6.QtWidgets import (
    QApplication, QCheckBox, QComboBox, QDockWidget, QFileDialog, QFrame, QHBoxLayout, QLabel,
    QLineEdit, QListWidget, QListWidgetItem, QMainWindow, QMessageBox, QProgressBar, QPushButton,
    QSpinBox, QSplitter, QTabWidget, QTextBrowser, QToolButton, QTreeWidget, QTreeWidgetItem,
    QVBoxLayout, QWidget, QAbstractItemView,
)

import processing as P
from dialogs import GUIDE_HTML, BatchDialog, DocDialog, ExportDialog
from fileio import OPEN_FILTER, SUPPORTED_EXT, human_size, read_image, write_image
from history import History, HistoryEntry
from info import CATEGORY_INFO, info_html
from processing import CATEGORIES, METHODS, PipelineStep
from theme import colors, stylesheet
from widgets import AnalysisPanel, ImagePanel, ParamPanel
from workers import CANCELLED, CameraThread, TaskWorker, detect_cameras

APP_NAME = "Pixel Lab"
SAVE_FILTERS = "PNG (*.png);;JPEG (*.jpg *.jpeg);;BMP (*.bmp);;TIFF (*.tif *.tiff);;WEBP (*.webp)"
RESOLUTIONS = [("Default", None), ("640 × 480", (640, 480)), ("1280 × 720", (1280, 720)), ("1920 × 1080", (1920, 1080))]
CATEGORY_LABEL = {"Transformation": "Geometric Transformation"}


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(APP_NAME)
        self.resize(1440, 860)
        self.setMinimumSize(1000, 640)
        self.setAcceptDrops(True)

        self.settings = QSettings("PixelLab", "PixelLab")
        self.dark = self.settings.value("dark", True, type=bool)

        # ---- state ----
        self.original = None
        self.meta = {}
        self.history = History()
        self.current_id = None
        self.busy = False
        self.state, self.state_detail = "Idle", ""
        self.camera = None
        self.live_frame = None
        self.live_processed = None
        self._shown_processed = None
        self._in_sync = False
        self._workers = []
        self._batch_dialog = None
        self._last_save_path = None
        self._tree_items = {}

        self._build_central()
        self._build_docks()
        self._build_menus()
        self._build_statusbar()
        self._apply_theme()
        self._refresh_all()
        self.set_state("Idle")
        self._detect_cameras()

        geo = self.settings.value("geometry")
        if geo:
            self.restoreGeometry(geo)

    # ======================================================================================
    # Pembangunan UI
    # ======================================================================================
    def _build_central(self):
        root = QWidget()
        root.setObjectName("root")
        outer = QHBoxLayout(root)
        outer.setContentsMargins(8, 8, 8, 8)
        self.main_split = QSplitter(Qt.Horizontal)
        outer.addWidget(self.main_split)
        self.setCentralWidget(root)

        # ---- Left sidebar ----
        self.sidebar = QFrame()
        self.sidebar.setObjectName("sidebar")
        self.sidebar.setMinimumWidth(200)
        sl = QVBoxLayout(self.sidebar)
        sl.setContentsMargins(10, 10, 10, 10)
        t = QLabel("Processing")
        t.setObjectName("panelTitle")
        sl.addWidget(t)
        self.search = QLineEdit()
        self.search.setPlaceholderText("Cari metode…")
        self.search.setClearButtonEnabled(True)
        self.search.textChanged.connect(self._filter_tree)
        sl.addWidget(self.search)
        self.tree = QTreeWidget()
        self.tree.setHeaderHidden(True)
        self.tree.setIndentation(14)
        for cat in CATEGORIES:
            top = QTreeWidgetItem([CATEGORY_LABEL.get(cat, cat)])
            f = top.font(0)
            f.setBold(True)
            top.setFont(0, f)
            top.setToolTip(0, CATEGORY_INFO[cat])
            self.tree.addTopLevelItem(top)
            for m in P.methods_in(cat):
                it = QTreeWidgetItem([m.name])
                it.setData(0, Qt.UserRole, m.id)
                if m.kind == "analysis":
                    it.setToolTip(0, "Analisis — tidak mengubah gambar")
                top.addChild(it)
                self._tree_items[m.id] = it
            top.setExpanded(cat == CATEGORIES[0])
        self.tree.currentItemChanged.connect(self._tree_changed)
        self.tree.itemClicked.connect(lambda it, _c: it.setExpanded(not it.isExpanded()) if it.parent() is None else None)
        sl.addWidget(self.tree, 1)
        self.main_split.addWidget(self.sidebar)

        # ---- Center workspace ----
        center = QWidget()
        cl = QVBoxLayout(center)
        cl.setContentsMargins(0, 0, 0, 0)
        cl.setSpacing(8)

        self.img_split = QSplitter(Qt.Horizontal)
        self.orig = ImagePanel("Original Image", "Drag & drop gambar di sini\natau gunakan Open Image / Open Camera",
                               accept_drops=True)
        self.proc = ImagePanel("Processed Image", "Processed image will appear here.")
        self.img_split.addWidget(self.orig)
        self.img_split.addWidget(self.proc)
        self.img_split.setSizes([1, 1])
        cl.addWidget(self.img_split, 1)

        # tombol panel asli
        self.orig.add_button("Open Image", self.open_image_dialog, "Buka gambar dari komputer (Ctrl+O)", first=True)
        self.orig.view.fileDropped.connect(self.open_path)
        self._build_camera_row()

        # tombol panel hasil
        self.proc_status = QLabel("Idle")
        self.proc_status.setObjectName("muted")
        self.proc.layout().insertWidget(2, self.proc_status)  # Processing Status di atas info output
        self.proc.add_button("Reset Result", self.reset_result, "Hapus hasil (gambar asli tidak berubah)")

        # kontrol perbandingan
        bar = QFrame()
        bar.setObjectName("panel")
        bl = QHBoxLayout(bar)
        bl.setContentsMargins(10, 6, 10, 6)
        self.sync_cb = QCheckBox("Synchronized Zoom && Pan")
        self.sync_cb.setChecked(True)
        self.sync_cb.toggled.connect(lambda on: self._sync(self.orig.view, self.proc.view) if on else None)
        self.peek_btn = QPushButton("Peek Original")
        self.peek_btn.setCheckable(True)
        self.peek_btn.setToolTip("Toggle Original / Processed: tampilkan gambar asli di panel kanan")
        self.peek_btn.toggled.connect(lambda _on: self._refresh_processed())
        reset_cmp = QPushButton("Reset Comparison View")
        reset_cmp.clicked.connect(self._reset_comparison)
        bl.addWidget(QLabel("Comparison"))
        bl.addWidget(self.sync_cb)
        bl.addWidget(self.peek_btn)
        bl.addWidget(reset_cmp)
        bl.addStretch(1)
        cl.addWidget(bar)

        self.orig.view.viewChanged.connect(lambda: self._sync(self.orig.view, self.proc.view))
        self.proc.view.viewChanged.connect(lambda: self._sync(self.proc.view, self.orig.view))
        self.orig.view.zoomChanged.connect(self._on_zoom)
        self.orig.view.pixelHovered.connect(self._hover_orig)
        self.proc.view.pixelHovered.connect(self._hover_proc)
        self.main_split.addWidget(center)

        # ---- Right sidebar ----
        self.rightbar = QFrame()
        self.rightbar.setObjectName("rightbar")
        self.rightbar.setMinimumWidth(300)
        rl = QVBoxLayout(self.rightbar)
        rl.setContentsMargins(12, 12, 12, 12)
        rl.setSpacing(6)
        self.m_title = QLabel("Pilih metode")
        self.m_title.setObjectName("methodTitle")
        self.m_cat = QLabel("Pilih metode pada sidebar kiri untuk melihat parameternya.")
        self.m_cat.setObjectName("muted")
        self.m_cat.setWordWrap(True)
        rl.addWidget(self.m_title)
        rl.addWidget(self.m_cat)
        self.tabs = QTabWidget()
        self.params = ParamPanel()
        self.params.changed.connect(self._on_params_changed)
        self.info_view = QTextBrowser()
        self.tabs.addTab(self.params, "Parameters")
        self.tabs.addTab(self.info_view, "Algorithm Info")
        rl.addWidget(self.tabs, 1)

        self.chain_cb = QCheckBox("Apply on previous result")
        self.chain_cb.setChecked(True)
        self.chain_cb.setToolTip("Aktif: operasi diterapkan pada hasil sebelumnya (rantai).\n"
                                 "Nonaktif: diterapkan pada gambar asli dan memulai rantai baru.")
        rl.addWidget(self.chain_cb)

        self.live_row = QWidget()
        lr = QHBoxLayout(self.live_row)
        lr.setContentsMargins(0, 0, 0, 0)
        lr.addWidget(QLabel("Live FPS"))
        self.fps_spin = QSpinBox()
        self.fps_spin.setRange(1, 30)
        self.fps_spin.setValue(10)
        self.fps_spin.setToolTip("Batas frame rate pemrosesan live (berlaku saat Apply ditekan).")
        lr.addWidget(self.fps_spin)
        lr.addStretch(1)
        self.stop_live_btn = QPushButton("Stop Processing")
        self.stop_live_btn.setObjectName("danger")
        self.stop_live_btn.clicked.connect(self.stop_live_processing)
        lr.addWidget(self.stop_live_btn)
        self.live_row.hide()
        rl.addWidget(self.live_row)

        self.pending_lbl = QLabel("")
        self.pending_lbl.setObjectName("pending")
        self.pending_lbl.setWordWrap(True)
        rl.addWidget(self.pending_lbl)
        self.progress = QProgressBar()
        self.progress.setRange(0, 0)
        self.progress.setTextVisible(False)
        self.progress.hide()
        rl.addWidget(self.progress)

        br = QHBoxLayout()
        self.reset_btn = QPushButton("Reset")
        self.reset_btn.setToolTip("Kembalikan parameter ke nilai default (tidak memproses)")
        self.reset_btn.clicked.connect(self.reset_params)
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.clicked.connect(self.cancel_task)
        self.cancel_btn.hide()
        self.apply_btn = QPushButton("Apply")
        self.apply_btn.setObjectName("apply")
        self.apply_btn.setShortcut("Ctrl+Return")
        self.apply_btn.setMinimumHeight(38)
        self.apply_btn.clicked.connect(self.apply)
        br.addWidget(self.reset_btn)
        br.addWidget(self.cancel_btn)
        br.addWidget(self.apply_btn, 1)
        rl.addLayout(br)
        self.main_split.addWidget(self.rightbar)

        self.main_split.setStretchFactor(0, 0)
        self.main_split.setStretchFactor(1, 1)
        self.main_split.setStretchFactor(2, 0)
        self.main_split.setSizes([230, 900, 340])
        self.main_split.setCollapsible(1, False)

    def _build_camera_row(self):
        row = QWidget()
        h = QHBoxLayout(row)
        h.setContentsMargins(0, 0, 0, 0)
        h.setSpacing(4)
        self.cam_combo = QComboBox()
        self.cam_combo.setSizeAdjustPolicy(QComboBox.AdjustToMinimumContentsLengthWithIcon)
        self.cam_combo.setMinimumContentsLength(8)
        self.cam_combo.setToolTip("Camera Selection")
        self.cam_combo.addItem("Mencari kamera…", None)
        self.cam_combo.currentIndexChanged.connect(lambda _i: self._rebuild_cam_menus())
        # Resolusi dipilih lewat menu Camera → Resolution (combo ini disimpan sebagai penyimpan nilai)
        self.res_combo = QComboBox(self)
        self.res_combo.hide()
        for name, val in RESOLUTIONS:
            self.res_combo.addItem(name, val)
        refresh = QPushButton("⟳")
        refresh.setToolTip("Deteksi ulang kamera")
        refresh.clicked.connect(self._detect_cameras)
        self.btn_cam_open = QPushButton("Open Camera")
        self.btn_cam_open.clicked.connect(self.open_camera)
        self.btn_capture = QPushButton("Capture")
        self.btn_capture.clicked.connect(self.capture)
        self.btn_cam_stop = QPushButton("Stop")
        self.btn_cam_stop.setToolTip("Stop Camera")
        self.btn_cam_stop.clicked.connect(self.stop_camera)
        for w in (self.cam_combo, refresh, self.btn_cam_open, self.btn_capture, self.btn_cam_stop):
            h.addWidget(w)
        h.addStretch(1)
        self.orig.layout().insertWidget(1, row)

    def _build_docks(self):
        # History
        hw = QWidget()
        hl = QVBoxLayout(hw)
        hl.setContentsMargins(6, 6, 6, 6)
        self.hist_list = QListWidget()
        self.hist_list.itemDoubleClicked.connect(lambda it: self._jump(self.hist_list.row(it) - 1))
        hl.addWidget(self.hist_list, 1)
        hr = QHBoxLayout()
        for text, slot in (("Undo", self.undo), ("Redo", self.redo), ("Clear History", self.clear_history)):
            b = QPushButton(text)
            b.clicked.connect(slot)
            hr.addWidget(b)
        hr.addStretch(1)
        hl.addLayout(hr)
        self.dock_history = self._make_dock("Processing History", hw, "dock_history")

        # Pipeline
        pw = QWidget()
        pl = QVBoxLayout(pw)
        pl.setContentsMargins(6, 6, 6, 6)
        self.pipe_list = QListWidget()
        self.pipe_list.setDragDropMode(QAbstractItemView.InternalMove)
        self.pipe_list.setDefaultDropAction(Qt.MoveAction)
        self.pipe_list.setToolTip("Drag untuk mengubah urutan, centang untuk mengaktifkan/menonaktifkan tahapan.")
        pl.addWidget(self.pipe_list, 1)
        pr = QHBoxLayout()
        for text, slot in (("Load from History", self.pipeline_from_history), ("Delete Step", self.pipeline_delete),
                           ("Save…", self.pipeline_save), ("Load…", self.pipeline_load), ("Batch…", self.open_batch)):
            b = QPushButton(text)
            b.clicked.connect(slot)
            pr.addWidget(b)
        run = QPushButton("Run Pipeline")
        run.setObjectName("apply")
        run.clicked.connect(self.run_pipeline)
        pr.addStretch(1)
        pr.addWidget(run)
        pl.addLayout(pr)
        self.dock_pipeline = self._make_dock("Processing Pipeline", pw, "dock_pipeline")

        # Analysis
        self.analysis = AnalysisPanel()
        self.dock_analysis = self._make_dock("Analysis", self.analysis, "dock_analysis")

        self.addDockWidget(Qt.BottomDockWidgetArea, self.dock_analysis)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.dock_history)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.dock_pipeline)
        self.tabifyDockWidget(self.dock_analysis, self.dock_history)
        self.tabifyDockWidget(self.dock_history, self.dock_pipeline)
        for d in (self.dock_analysis, self.dock_history, self.dock_pipeline):
            d.hide()
            d.setMinimumHeight(170)

    def _make_dock(self, title, widget, name):
        d = QDockWidget(title, self)
        d.setObjectName(name)
        d.setWidget(widget)
        d.setFeatures(QDockWidget.DockWidgetClosable | QDockWidget.DockWidgetMovable)
        return d

    def _build_statusbar(self):
        sb = self.statusBar()
        self.sb_res, self.sb_fmt, self.sb_cam, self.sb_state, self.sb_zoom = (QLabel() for _ in range(5))
        self.sb_res.setText("Resolution: -")
        self.sb_fmt.setText("Format: -")
        self.sb_cam.setText("Camera: Off")
        self.sb_zoom.setText("Zoom: -")
        for w in (self.sb_res, self.sb_fmt, self.sb_cam, self.sb_state, self.sb_zoom):
            sb.addPermanentWidget(w)

    def _act(self, menu, text, slot, shortcut=None, checkable=False):
        a = QAction(text, self)
        if shortcut:
            a.setShortcut(QKeySequence(shortcut))
        if checkable:
            a.setCheckable(True)
            a.toggled.connect(slot)
        else:
            a.triggered.connect(lambda _=False, s=slot: s())
        menu.addAction(a)
        return a

    def _build_menus(self):
        mb = self.menuBar()
        logo = QLabel("◧ PIXEL LAB")
        logo.setObjectName("logo")
        mb.setCornerWidget(logo, Qt.TopLeftCorner)
        self.theme_btn = QToolButton()
        self.theme_btn.setToolTip("Theme Toggle (Dark / Light)")
        self.theme_btn.clicked.connect(self.toggle_theme)
        mb.setCornerWidget(self.theme_btn, Qt.TopRightCorner)

        # File
        m = mb.addMenu("&File")
        self._act(m, "Open Image…", self.open_image_dialog, "Ctrl+O")
        self.recent_menu = m.addMenu("Open Recent")
        self.recent_menu.aboutToShow.connect(self._fill_recent)
        m.addSeparator()
        self.act_save = self._act(m, "Save Result", self.save_result, "Ctrl+S")
        self.act_save_as = self._act(m, "Save As…", self.save_as, "Ctrl+Shift+S")
        self.act_export = self._act(m, "Export…", self.export_dialog, "Ctrl+E")
        m.addSeparator()
        self._act(m, "Batch Processing…", self.open_batch, "Ctrl+B")
        m.addSeparator()
        self._act(m, "Exit", self.close, "Ctrl+Q")

        # Processing
        m = mb.addMenu("&Processing")
        for cat in CATEGORIES:
            sub = m.addMenu(CATEGORY_LABEL.get(cat, cat))
            for meth in P.methods_in(cat):
                self._act(sub, meth.name, lambda mid=meth.id: self.select_method_by_id(mid))

        # Camera
        m = mb.addMenu("&Camera")
        self._act(m, "Open Camera", self.open_camera)
        self.cam_menu = m.addMenu("Select Camera")
        self.res_menu = m.addMenu("Resolution")
        self._act(m, "Capture", self.capture, "Ctrl+Space")
        self._act(m, "Stop Camera", self.stop_camera)
        m.addSeparator()
        self._act(m, "Detect Cameras", self._detect_cameras)
        self._rebuild_cam_menus()

        # History
        m = mb.addMenu("&History")
        self._act(m, "Processing History", lambda: self._show_dock(self.dock_history))
        self.act_undo = self._act(m, "Undo", self.undo, "Ctrl+Z")
        self.act_redo = self._act(m, "Redo", self.redo, "Ctrl+Y")
        self._act(m, "Reset Result", self.reset_result)
        self._act(m, "Clear History", self.clear_history)

        # View
        m = mb.addMenu("&View")
        sub = m.addMenu("Show / Hide Panels")
        for text, widget in (("Processing Sidebar", self.sidebar), ("Adjustment Panel", self.rightbar)):
            a = self._act(sub, text, lambda on, w=widget: w.setVisible(on), checkable=True)
            a.setChecked(True)
        for d in (self.dock_analysis, self.dock_history, self.dock_pipeline):
            sub.addAction(d.toggleViewAction())
        m.addSeparator()
        self._act(m, "Zoom In", lambda: self._zoom(1.25), "Ctrl++")
        self._act(m, "Zoom Out", lambda: self._zoom(1 / 1.25), "Ctrl+-")
        self._act(m, "Fit to Screen", lambda: self._zoom(None), "Ctrl+0")
        self._act(m, "Actual Size (100%)", lambda: self._zoom(0), "Ctrl+1")
        m.addSeparator()
        self._act(m, "Reset Layout", self.reset_layout)

        # Help
        m = mb.addMenu("&Help")
        self._act(m, "User Guide", self.show_guide, "F1")
        self._act(m, "Algorithm Documentation", self.show_docs)
        self._act(m, "About Application", self.show_about)

    # ======================================================================================
    # Tema, state, status
    # ======================================================================================
    def _apply_theme(self):
        QApplication.instance().setStyleSheet(stylesheet(self.dark))
        self.theme_btn.setText("☀" if self.dark else "☾")
        self.analysis.set_theme(self.dark, colors(self.dark))
        self.set_state(self.state, self.state_detail)

    def toggle_theme(self):
        self.dark = not self.dark
        self.settings.setValue("dark", self.dark)
        self._apply_theme()

    def set_state(self, state: str, detail: str = ""):
        self.state, self.state_detail = state, detail
        c = colors(self.dark)
        col = {"Idle": c["muted"], "Configuring": c["warn"], "Processing": c["accent"],
               "Completed": c["ok"], "Failed": c["danger"], "Cancelled": c["warn"]}[state]
        text = f"{state}" + (f" — {detail}" if detail else "")
        self.sb_state.setText(f"Processing: {text}")
        self.sb_state.setStyleSheet(f"color:{col};")
        self.proc_status.setText(state)
        self.proc_status.setStyleSheet(f"color:{col};")

    def _msg(self, text: str, ms: int = 5000):
        self.statusBar().showMessage(text, ms)

    def _on_zoom(self, pct: float):
        self.sb_zoom.setText("Zoom: -" if pct <= 0 else f"Zoom: {pct:.0f}%")

    # ======================================================================================
    # Sinkronisasi view / zoom
    # ======================================================================================
    def _sync(self, src, dst):
        if self._in_sync or not self.sync_cb.isChecked():
            return
        self._in_sync = True
        try:
            dst.apply_state(src.view_state())
        finally:
            self._in_sync = False

    def _zoom(self, factor):
        views = [self.orig.view] if self.sync_cb.isChecked() else [self.orig.view, self.proc.view]
        for v in views:
            if factor is None:
                v.fit()
            elif factor == 0:
                v.actual_size()
            else:
                v.zoom(factor)

    def _reset_comparison(self):
        self._in_sync = True
        self.orig.view.fit()
        self.proc.view.fit()
        self._in_sync = False

    # ======================================================================================
    # Pemilihan metode & parameter  (TIDAK menjalankan pemrosesan)
    # ======================================================================================
    def _tree_changed(self, cur, _prev):
        if cur is not None and cur.data(0, Qt.UserRole):
            self.select_method(cur.data(0, Qt.UserRole))

    def _filter_tree(self, text: str):
        t = text.lower().strip()
        for i in range(self.tree.topLevelItemCount()):
            top = self.tree.topLevelItem(i)
            any_vis = False
            for j in range(top.childCount()):
                ch = top.child(j)
                vis = (t in ch.text(0).lower()) if t else True
                ch.setHidden(not vis)
                any_vis |= vis
            top.setHidden(bool(t) and not any_vis)
            if t:
                top.setExpanded(any_vis)

    def select_method_by_id(self, mid: str):
        it = self._tree_items.get(mid)
        if it is not None:
            it.parent().setExpanded(True)
            self.tree.setCurrentItem(it)

    def select_method(self, mid: str):
        m = METHODS[mid]
        self.current_id = mid
        self.m_title.setText(m.name)
        self.m_cat.setText(f"{CATEGORY_LABEL.get(m.category, m.category)} · "
                           + ("Analisis (tidak mengubah gambar)" if m.kind == "analysis" else "Pemrosesan citra"))
        self.params.set_method(m)
        self.info_view.setHtml(info_html(m))
        self.chain_cb.setVisible(m.kind == "process")
        self.pending_lbl.setText("")
        if self._has_source():
            self.set_state("Configuring", m.name)
        self._update_actions()

    def _on_params_changed(self):
        self.pending_lbl.setText("● Pending changes — tekan Apply"
                                 + (" (live masih memakai parameter sebelumnya)" if self.camera and self.camera.processing else ""))
        if self._has_source() and not self.busy:
            self.set_state("Configuring", METHODS[self.current_id].name if self.current_id else "")

    def reset_params(self):
        """Kembalikan parameter ke default. Tidak menjalankan pemrosesan; hasil lama tetap tampil."""
        self.params.reset()
        self.pending_lbl.setText("")

    # ======================================================================================
    # APPLY - satu-satunya titik yang menjalankan pemrosesan
    # ======================================================================================
    def _has_source(self) -> bool:
        return self.original is not None or self.camera is not None

    def _update_actions(self):
        can_apply = self._has_source() and self.current_id is not None and not self.busy
        self.apply_btn.setEnabled(can_apply)
        self.apply_btn.setText("Processing…" if self.busy else "Apply")
        self.reset_btn.setEnabled(self.current_id is not None and not self.busy)
        self.progress.setVisible(self.busy)
        self.cancel_btn.setVisible(self.busy)
        has_result = self.history.current_image() is not None
        self.act_undo.setEnabled(self.history.can_undo and not self.camera)
        self.act_redo.setEnabled(self.history.can_redo and not self.camera)
        self.act_save.setEnabled(self.original is not None)
        self.act_save_as.setEnabled(self.original is not None)
        self.act_export.setEnabled(self.original is not None)
        self.btn_cam_open.setEnabled(self.camera is None)
        self.btn_cam_stop.setEnabled(self.camera is not None)
        self.btn_capture.setEnabled(self.camera is not None)
        self.cam_combo.setEnabled(self.camera is None)
        self.res_combo.setEnabled(self.camera is None)
        self.live_row.setVisible(self.camera is not None)
        self.stop_live_btn.setVisible(bool(self.camera and self.camera.processing))
        self.chain_cb.setEnabled(has_result and self.camera is None)
        self.peek_btn.setEnabled(self.original is not None)

    def apply(self):
        if self.busy or self.current_id is None:
            return
        m = METHODS[self.current_id]
        params = m.resolve(self.params.values())
        live = self.camera is not None

        # --- Live Processing (kamera) ---
        if live and m.kind == "process":
            self.camera.set_processing(m.id, params, self.fps_spin.value())
            self.pending_lbl.setText("")
            self.set_state("Processing", f"Live: {m.name}")
            self._msg(f"Live Processing aktif: {m.name}. Ubah parameter lalu tekan Apply lagi untuk memperbarui.")
            self._update_actions()
            return

        src_orig = self.live_frame if live else self.original
        if src_orig is None:
            QMessageBox.information(self, "Apply", "Belum ada gambar. Buka gambar atau kamera terlebih dahulu.")
            return
        self.pending_lbl.setText("")

        if m.kind == "analysis":
            if params.get("source") == "Processed Image":
                img = self.live_processed if live else self.history.current_image()
                if img is None:
                    QMessageBox.information(self, "Analysis", "Belum ada gambar hasil. Jalankan sebuah metode terlebih dahulu "
                                                              "atau pilih sumber 'Original Image'.")
                    return
            else:
                img = src_orig
            self._run_async(lambda cancel: P.run_method(m.id, img, params),
                            lambda res: self._on_analysis_done(m, res), m.name)
            return

        prev = self.history.current_image()
        chain = self.chain_cb.isChecked() and prev is not None
        src = prev if chain else self.original
        base = "previous" if chain else "original"
        self._run_async(lambda cancel: P.run_method(m.id, src, params),
                        lambda res: self._on_process_done(m, params, base, res), m.name)

    def _run_async(self, fn, on_ok, label: str):
        self.busy = True
        self.set_state("Processing", label)
        self._update_actions()
        w = TaskWorker(fn, self)
        self._worker = w
        w.succeeded.connect(lambda res: self._task_ok(on_ok, res, label))
        w.failed.connect(self._task_failed)
        w.finished.connect(lambda ww=w: self._reap(ww))
        self._workers.append(w)
        w.start()

    def _reap(self, w):
        if w in self._workers:
            self._workers.remove(w)
        w.deleteLater()

    def cancel_task(self):
        w = getattr(self, "_worker", None)
        if w is not None and w.isRunning():
            w.cancel()

    def _task_ok(self, on_ok, res, label):
        self.busy = False
        try:
            on_ok(res)
            self.set_state("Completed", label)
        except Exception as e:  # noqa: BLE001
            self.set_state("Failed", str(e))
            QMessageBox.warning(self, "Gagal menampilkan hasil", str(e))
        self._update_actions()

    def _task_failed(self, msg: str):
        self.busy = False
        if msg == CANCELLED:
            self.set_state("Cancelled")
            self._msg("Pemrosesan dibatalkan.")
        else:
            self.set_state("Failed", msg)
            QMessageBox.warning(self, "Pemrosesan gagal", f"Terjadi kesalahan saat memproses gambar:\n\n{msg}")
        self._update_actions()

    def _on_process_done(self, m, params, base, result):
        self.history.push(HistoryEntry(m.id, params, result, base))
        if base == "original":
            self.pipe_list.clear()
        self._add_pipeline_item(PipelineStep(m.id, dict(params), True))
        self._refresh_all()
        self._msg(f"{m.name} diterapkan → {result.shape[1]}×{result.shape[0]} px")

    def _on_analysis_done(self, m, res):
        self.analysis.show_result(res)
        self._show_dock(self.dock_analysis)
        self._msg(f"Analisis: {m.name}")

    # ======================================================================================
    # Tampilan hasil / history / pipeline
    # ======================================================================================
    def _refresh_all(self):
        self._refresh_processed()
        self._refresh_history_list()
        self._update_actions()

    def _refresh_processed(self):
        if self.camera is not None:  # saat live, panel hasil dikendalikan frame kamera
            return
        img = self.history.current_image()
        if self.peek_btn.isChecked() and self.original is not None:
            show = self.original
        else:
            show = img
        self._shown_processed = show
        self.proc.view.set_image(show)
        if img is None:
            self.proc.set_info("Belum ada hasil pemrosesan.")
        else:
            e = self.history.entries[self.history.index]
            h, w = img.shape[:2]
            self.proc.set_info(f"Output: {w} × {h} px · 3 kanal (BGR) · {e.name} · {e.param_text}")

    def _refresh_history_list(self):
        self.hist_list.clear()
        self.hist_list.addItem("0. Original Image")
        c = colors(self.dark)
        for i, e in enumerate(self.history.entries):
            tag = "  ⟲ dari gambar asli" if e.base == "original" else ""
            it = QListWidgetItem(f"{i + 1}. {e.name} — {e.param_text}   [{e.time:%H:%M:%S}]{tag}")
            it.setToolTip(f"Status: {e.status}")
            if i > self.history.index:
                it.setForeground(Qt.gray)  # cabang redo
            self.hist_list.addItem(it)
        self.hist_list.setCurrentRow(self.history.index + 1)

    def _jump(self, idx: int):
        if self.camera:
            return
        self.history.jump(idx)
        self._rebuild_pipeline_from_history()
        self._refresh_all()

    def undo(self):
        if self.history.can_undo and not self.camera:
            self.history.undo()
            self._rebuild_pipeline_from_history()
            self._refresh_all()

    def redo(self):
        if self.history.can_redo and not self.camera:
            self.history.redo()
            self._rebuild_pipeline_from_history()
            self._refresh_all()

    def reset_result(self):
        """Hapus hasil dari panel (gambar asli tetap). Masih bisa dikembalikan lewat Redo."""
        if self.camera and self.camera.processing:
            self.stop_live_processing()
        self.live_processed = None
        if self.camera:
            self.proc.view.set_image(None)
            self._shown_processed = None
        self.history.jump(-1)
        self._refresh_all()
        self.set_state("Idle" if not self.current_id else "Configuring", "")
        self._msg("Hasil direset. Gambar asli tidak berubah.")

    def clear_history(self):
        self.history.clear()
        self._rebuild_pipeline_from_history()
        self._refresh_all()
        self._msg("History dihapus.")

    def _show_dock(self, dock):
        dock.show()
        dock.raise_()

    # ---- pipeline ----
    def _add_pipeline_item(self, step: PipelineStep):
        it = QListWidgetItem(f"{step.label}  ({P.describe_params(step.method_id, step.params)})")
        it.setFlags(it.flags() | Qt.ItemIsUserCheckable | Qt.ItemIsDragEnabled)
        it.setCheckState(Qt.Checked if step.enabled else Qt.Unchecked)
        it.setData(Qt.UserRole, step)
        self.pipe_list.addItem(it)

    def _rebuild_pipeline_from_history(self):
        self.pipe_list.clear()
        for s in self.history.to_steps():
            self._add_pipeline_item(s)

    def pipeline_from_history(self):
        self._rebuild_pipeline_from_history()

    def _pipeline_steps(self) -> list:
        steps = []
        for i in range(self.pipe_list.count()):
            it = self.pipe_list.item(i)
            s = it.data(Qt.UserRole)
            steps.append(PipelineStep(s.method_id, dict(s.params), it.checkState() == Qt.Checked))
        return steps

    def pipeline_delete(self):
        for it in self.pipe_list.selectedItems():
            self.pipe_list.takeItem(self.pipe_list.row(it))

    def pipeline_save(self):
        steps = self._pipeline_steps()
        if not steps:
            QMessageBox.information(self, "Pipeline", "Pipeline kosong.")
            return
        path, _ = QFileDialog.getSaveFileName(self, "Simpan pipeline", "pipeline.json", "Pipeline (*.json)")
        if not path:
            return
        data = [{"method": s.method_id, "params": s.params, "enabled": s.enabled} for s in steps]
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            self._msg(f"Pipeline disimpan: {path}")
        except OSError as e:
            QMessageBox.critical(self, "Pipeline", f"Gagal menyimpan: {e}")

    def pipeline_load(self):
        path, _ = QFileDialog.getOpenFileName(self, "Muat pipeline", "", "Pipeline (*.json)")
        if not path:
            return
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            steps = []
            for d in data:
                mid = d["method"]
                if mid not in METHODS or METHODS[mid].kind != "process":
                    raise ValueError(f"Metode tidak dikenal: {mid}")
                steps.append(PipelineStep(mid, dict(d.get("params", {})), bool(d.get("enabled", True))))
        except Exception as e:  # noqa: BLE001
            QMessageBox.critical(self, "Pipeline", f"File pipeline tidak valid:\n{e}")
            return
        self.pipe_list.clear()
        for s in steps:
            self._add_pipeline_item(s)
        self._msg(f"{len(steps)} langkah dimuat.")

    def run_pipeline(self):
        if self.busy:
            return
        if self.original is None or self.camera is not None:
            QMessageBox.information(self, "Pipeline", "Buka gambar statis terlebih dahulu (matikan kamera).")
            return
        steps = self._pipeline_steps()
        active = [s for s in steps if s.enabled]
        if not active:
            QMessageBox.information(self, "Pipeline", "Tidak ada tahapan aktif di pipeline.")
            return
        orig = self.original

        def done(res):
            self.history.push(HistoryEntry("Pipeline", {}, res, "original", note=f"{len(active)} langkah", steps=active))
            self._refresh_all()
            self._msg(f"Pipeline ({len(active)} langkah) selesai.")

        self._run_async(lambda cancel: P.run_pipeline(orig, active, cancel), done, f"Pipeline ({len(active)} langkah)")

    def open_batch(self):
        steps = [s for s in self._pipeline_steps() if s.enabled]
        ms = None
        if self.current_id and METHODS[self.current_id].kind == "process":
            ms = PipelineStep(self.current_id, METHODS[self.current_id].resolve(self.params.values()))
        if not steps and ms is None:
            QMessageBox.information(self, "Batch", "Pilih metode pemrosesan (atau isi pipeline) terlebih dahulu.")
            return
        d = os.path.join(os.path.dirname(self.meta.get("path", "")) or os.path.expanduser("~"), "pixel_lab_output")
        self._batch_dialog = BatchDialog(self, steps, ms, d)
        self._batch_dialog.exec()

    # ======================================================================================
    # Gambar: buka / simpan / export
    # ======================================================================================
    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls():
            e.acceptProposedAction()

    def dropEvent(self, e):
        urls = e.mimeData().urls()
        if urls:
            self.open_path(urls[0].toLocalFile())

    def open_image_dialog(self):
        start = self.settings.value("last_dir", "", type=str)
        path, _ = QFileDialog.getOpenFileName(self, "Open Image", start, OPEN_FILTER)
        if path:
            self.open_path(path)

    def open_path(self, path: str):
        try:
            img, meta = read_image(path)
        except Exception as e:  # noqa: BLE001
            QMessageBox.critical(self, "Gagal membuka gambar", str(e))
            return
        if self.camera:
            self.stop_camera()
        self.settings.setValue("last_dir", os.path.dirname(path))
        recent = [p for p in self.settings.value("recent", [], type=list) if p != path]
        self.settings.setValue("recent", ([path] + recent)[:8])
        self._last_save_path = None
        self.set_original(img, meta)
        self._msg(f"Dibuka: {meta['name']}")

    def _fill_recent(self):
        self.recent_menu.clear()
        recent = [p for p in self.settings.value("recent", [], type=list) if os.path.isfile(p)]
        if not recent:
            a = self.recent_menu.addAction("(kosong)")
            a.setEnabled(False)
        for p in recent:
            self._act(self.recent_menu, os.path.basename(p), lambda path=p: self.open_path(path))

    def set_original(self, img, meta: dict):
        self.original, self.meta = img, meta
        self.history.clear()
        self.pipe_list.clear()
        self.live_processed = None
        self.peek_btn.setChecked(False)
        self.orig.view.set_image(img, refit=True)
        self.orig.set_info(
            f"{meta['name']} · {meta['format']} · {meta['width']}×{meta['height']} px · "
            f"{meta['channels']} kanal ({meta['mode']}) · {human_size(meta['size_bytes']) if meta['size_bytes'] else 'belum disimpan'}")
        self.sb_res.setText(f"Resolution: {meta['width']} × {meta['height']}")
        self.sb_fmt.setText(f"Format: {meta['format']}")
        self._refresh_all()
        self.set_state("Configuring" if self.current_id else "Idle", METHODS[self.current_id].name if self.current_id else "")

    def _default_dir(self) -> str:
        p = self.meta.get("path")
        return os.path.dirname(p) if p else self.settings.value("last_dir", os.path.expanduser("~"), type=str) or os.path.expanduser("~")

    def _save_target(self):
        """Gambar yang akan disimpan: hasil terakhir, atau (jika belum ada hasil) gambar asli setelah konfirmasi."""
        img = self.history.current_image()
        if img is not None:
            return img, "processed"
        if self.original is None:
            return None, ""
        r = QMessageBox.question(self, "Belum ada hasil", "Belum ada hasil pemrosesan.\nSimpan gambar asli / hasil capture?")
        return (self.original, "original") if r == QMessageBox.Yes else (None, "")

    def _base_name(self, suffix: str) -> str:
        stem = os.path.splitext(self.meta.get("name", "image"))[0]
        return stem + suffix

    def _write(self, path: str, img, quality: int = 95) -> bool:
        src = self.meta.get("path")
        if src and os.path.abspath(src) == os.path.abspath(path):
            r = QMessageBox.warning(self, "Menimpa file asli", "Anda akan menimpa FILE GAMBAR ASLI.\nLanjutkan?",
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if r != QMessageBox.Yes:
                return False
        try:
            write_image(path, img, quality)
        except Exception as e:  # noqa: BLE001
            QMessageBox.critical(self, "Gagal menyimpan", str(e))
            return False
        self._last_save_path = path
        self._msg(f"Tersimpan: {path}", 7000)
        return True

    def save_result(self):
        img, kind = self._save_target()
        if img is None:
            return
        if self._last_save_path:
            r = QMessageBox.question(self, "Timpa file?", f"Timpa '{os.path.basename(self._last_save_path)}' dengan hasil terbaru?")
            if r == QMessageBox.Yes:
                self._write(self._last_save_path, img)
            return
        self.save_as()

    def save_as(self):
        img, kind = self._save_target()
        if img is None:
            return
        suffix = "_processed" if kind == "processed" else ""
        start = os.path.join(self._default_dir(), self._base_name(suffix) + ".png")
        path, flt = QFileDialog.getSaveFileName(self, "Save As", start, SAVE_FILTERS)
        if not path:
            return
        ext = os.path.splitext(path)[1].lower()
        if ext not in SUPPORTED_EXT:
            ext = ".jpg" if flt.startswith("JPEG") else ".bmp" if flt.startswith("BMP") else ".tiff" if flt.startswith("TIFF") \
                else ".webp" if flt.startswith("WEBP") else ".png"
            path += ext
        self._write(path, img)

    def export_dialog(self):
        img, kind = self._save_target()
        if img is None:
            return
        h, w = img.shape[:2]
        dlg = ExportDialog(self, self._base_name("_processed" if kind == "processed" else ""), self._default_dir(), (w, h))
        if dlg.exec():
            v = dlg.values()
            out = img
            if abs(v["scale"] - 1.0) > 1e-6:
                interp = cv2.INTER_AREA if v["scale"] < 1 else cv2.INTER_CUBIC
                out = cv2.resize(img, (max(1, round(w * v["scale"])), max(1, round(h * v["scale"]))), interpolation=interp)
            self._write(v["path"], out, v["quality"])

    # ======================================================================================
    # Kamera
    # ======================================================================================
    def _detect_cameras(self):
        if self.camera:
            return
        self.cam_combo.clear()
        self.cam_combo.addItem("Mencari kamera…", None)
        w = TaskWorker(lambda cancel: detect_cameras(), self)
        w.succeeded.connect(self._fill_cameras)
        w.failed.connect(lambda _m: self._fill_cameras([]))
        w.finished.connect(lambda ww=w: self._reap(ww))
        self._workers.append(w)
        w.start()

    def _fill_cameras(self, indices):
        self.cam_combo.blockSignals(True)
        self.cam_combo.clear()
        if not indices:
            self.cam_combo.addItem("Kamera tidak ditemukan", None)
        for i in indices:
            self.cam_combo.addItem(f"Camera {i}", i)
        self.cam_combo.blockSignals(False)
        self._rebuild_cam_menus()
        self._msg(f"{len(indices)} kamera terdeteksi." if indices else "Tidak ada kamera terdeteksi.")

    def _rebuild_cam_menus(self):
        self.cam_menu.clear()
        self.res_menu.clear()
        g1, g2 = QActionGroup(self), QActionGroup(self)
        for i in range(self.cam_combo.count()):
            a = QAction(self.cam_combo.itemText(i), self, checkable=True)
            a.setChecked(i == self.cam_combo.currentIndex())
            a.triggered.connect(lambda _=False, idx=i: self.cam_combo.setCurrentIndex(idx))
            g1.addAction(a)
            self.cam_menu.addAction(a)
        for i in range(self.res_combo.count()):
            a = QAction(self.res_combo.itemText(i), self, checkable=True)
            a.setChecked(i == self.res_combo.currentIndex())
            a.triggered.connect(lambda _=False, idx=i: self.res_combo.setCurrentIndex(idx))
            g2.addAction(a)
            self.res_menu.addAction(a)

    def open_camera(self):
        if self.camera:
            return
        idx = self.cam_combo.currentData()
        if idx is None:
            QMessageBox.information(self, "Camera", "Tidak ada kamera yang dipilih / terdeteksi.\nSambungkan webcam lalu klik ⟳.")
            return
        self.camera = CameraThread(idx, self.res_combo.currentData(), self)
        self.camera.frame.connect(self._on_frame)
        self.camera.error.connect(self._on_cam_error)
        self.camera.opened.connect(lambda w, h, i=idx: self.sb_cam.setText(f"Camera: {i} · {w}×{h}"))
        self.sb_cam.setText("Camera: membuka…")
        self.peek_btn.setChecked(False)
        self.camera.start()
        self.set_state("Configuring" if self.current_id else "Idle", "Live preview (tanpa pemrosesan)")
        self._update_actions()

    def _on_frame(self, orig, proc):
        if self.camera is None:
            return
        self.live_frame = orig
        self.orig.view.set_image(orig)
        h, w = orig.shape[:2]
        self.orig.set_info(f"LIVE · Camera {self.camera.index} · {w}×{h} px")
        self.sb_res.setText(f"Resolution: {w} × {h}")
        self.sb_fmt.setText("Format: LIVE")
        if proc is not None:
            self.live_processed = proc
            self._shown_processed = proc
            self.proc.view.set_image(proc)
            self.proc.set_info(f"LIVE · {METHODS[self.current_id].name if self.current_id else ''} · "
                               f"{proc.shape[1]}×{proc.shape[0]} px")

    def _on_cam_error(self, msg: str):
        QMessageBox.warning(self, "Camera", msg)
        if self.camera and not self.camera.isRunning():
            self.stop_camera()
        elif self.camera and not self.camera.processing:
            self._update_actions()

    def stop_live_processing(self):
        if self.camera:
            self.camera.set_processing(None)
            self.set_state("Configuring" if self.current_id else "Idle", "Live preview (tanpa pemrosesan)")
            self._msg("Live Processing dihentikan. Kamera tetap aktif.")
            self._update_actions()

    def stop_camera(self):
        if not self.camera:
            return
        cam, self.camera = self.camera, None
        try:
            cam.frame.disconnect()
            cam.error.disconnect()
        except (RuntimeError, TypeError):
            pass
        cam.stop()
        cam.deleteLater()
        self.live_frame = None
        self.live_processed = None
        self.sb_cam.setText("Camera: Off")
        self.orig.view.set_image(self.original, refit=True)
        if self.original is not None:
            m = self.meta
            self.orig.set_info(f"{m['name']} · {m['format']} · {m['width']}×{m['height']} px")
            self.sb_res.setText(f"Resolution: {m['width']} × {m['height']}")
            self.sb_fmt.setText(f"Format: {m['format']}")
        else:
            self.orig.set_info("-")
            self.sb_res.setText("Resolution: -")
            self.sb_fmt.setText("Format: -")
        self._refresh_all()
        self.set_state("Idle")

    def capture(self):
        if not self.camera or self.live_frame is None:
            QMessageBox.information(self, "Capture", "Buka kamera terlebih dahulu.")
            return
        frame = self.live_frame.copy()
        self.stop_camera()
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        h, w = frame.shape[:2]
        meta = {"name": f"capture_{ts}", "path": "", "format": "CAPTURE", "width": w, "height": h,
                "channels": 3, "bit_depth": 8, "mode": "RGB", "size_bytes": 0}
        self._last_save_path = None
        self.set_original(frame, meta)
        self._msg("Gambar diambil dari kamera dan ditetapkan sebagai sumber statis.")

    # ======================================================================================
    # Hover (Pixel Inspector)
    # ======================================================================================
    def _hover_orig(self, x, y):
        img = self.live_frame if self.camera else self.original
        self.analysis.update_pixel("Original", x, y, img)

    def _hover_proc(self, x, y):
        self.analysis.update_pixel("Processed", x, y, self._shown_processed)

    # ======================================================================================
    # View / Help
    # ======================================================================================
    def reset_layout(self):
        self.sidebar.show()
        self.rightbar.show()
        self.main_split.setSizes([230, 900, 340])
        self.img_split.setSizes([1, 1])
        for d in (self.dock_analysis, self.dock_history, self.dock_pipeline):
            d.hide()
        self._reset_comparison()

    def show_guide(self):
        from PySide6.QtWidgets import QDialog

        dlg = QDialog(self)
        dlg.setWindowTitle("User Guide")
        dlg.resize(700, 640)
        lay = QVBoxLayout(dlg)
        tb = QTextBrowser()
        tb.setHtml(GUIDE_HTML)
        lay.addWidget(tb)
        dlg.exec()

    def show_docs(self):
        DocDialog(self, list(METHODS.values()), self.current_id).exec()

    def show_about(self):
        QMessageBox.about(self, f"About {APP_NAME}",
                          f"<h3>{APP_NAME} 1.0</h3><p>Desktop Image Processing Studio untuk mata kuliah Pengolahan Citra Digital.</p>"
                          f"<p>Python · PySide6 · OpenCV · NumPy · Pillow · Matplotlib</p>"
                          f"<p><i>No processing without user confirmation.</i></p>")

    # ======================================================================================
    def closeEvent(self, e):
        self.settings.setValue("geometry", self.saveGeometry())
        if self.camera:
            self.stop_camera()  # lepaskan kamera
        for w in list(self._workers):
            w.cancel()
            w.wait(3000)
        super().closeEvent(e)


def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setApplicationName(APP_NAME)
    win = MainWindow()
    win.show()
    for a in sys.argv[1:]:  # python main.py gambar.jpg
        if os.path.isfile(a):
            win.open_path(a)
            break
    sys.exit(app.exec())


if __name__ == "__main__":
    main()


# Kontribusi oleh Hasanrbn