"""Pixora - Dialog: Export, Batch Processing, Dokumentasi algoritma, User Guide."""
from __future__ import annotations

import os

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QButtonGroup, QComboBox, QDialog, QFileDialog, QFormLayout, QGroupBox, QHBoxLayout, QLabel,
    QLineEdit, QListWidget, QListWidgetItem, QMessageBox, QProgressBar, QPushButton, QRadioButton,
    QSlider, QSpinBox, QSplitter, QTextBrowser, QVBoxLayout,
)

import processing as P
from fileio import OUTPUT_FORMATS, OPEN_FILTER, list_images
from info import info_html
from workers import BatchWorker


# ======================================================================================
class ExportDialog(QDialog):
    def __init__(self, parent, default_name: str, default_dir: str, size):
        super().__init__(parent)
        self.setWindowTitle("Export Processed Image")
        self.setMinimumWidth(460)
        self._size = size
        lay = QVBoxLayout(self)
        form = QFormLayout()
        form.setSpacing(10)

        row = QHBoxLayout()
        self.dir_edit = QLineEdit(default_dir)
        b = QPushButton("Browse…")
        b.clicked.connect(self._browse)
        row.addWidget(self.dir_edit, 1)
        row.addWidget(b)
        form.addRow("Lokasi", row)

        self.name_edit = QLineEdit(default_name)
        form.addRow("Nama file", self.name_edit)

        self.fmt = QComboBox()
        self.fmt.addItems(list(OUTPUT_FORMATS))
        self.fmt.currentTextChanged.connect(self._fmt_changed)
        form.addRow("Format", self.fmt)

        qrow = QHBoxLayout()
        self.q_slider = QSlider(Qt.Horizontal)
        self.q_slider.setRange(1, 100)
        self.q_slider.setValue(95)
        self.q_label = QLabel("95")
        self.q_slider.valueChanged.connect(lambda v: self.q_label.setText(str(v)))
        qrow.addWidget(self.q_slider, 1)
        qrow.addWidget(self.q_label)
        form.addRow("Kualitas", qrow)

        self.scale = QSpinBox()
        self.scale.setRange(10, 400)
        self.scale.setValue(100)
        self.scale.setSuffix(" %")
        self.scale.valueChanged.connect(self._update_size)
        form.addRow("Resolusi hasil", self.scale)
        self.size_label = QLabel()
        self.size_label.setObjectName("muted")
        form.addRow("", self.size_label)
        lay.addLayout(form)

        btns = QHBoxLayout()
        btns.addStretch(1)
        cancel = QPushButton("Batal")
        cancel.clicked.connect(self.reject)
        ok = QPushButton("Export")
        ok.setObjectName("apply")
        ok.clicked.connect(self._accept)
        btns.addWidget(cancel)
        btns.addWidget(ok)
        lay.addLayout(btns)
        self._fmt_changed(self.fmt.currentText())
        self._update_size()
        self.path = ""

    def _browse(self):
        d = QFileDialog.getExistingDirectory(self, "Pilih folder output", self.dir_edit.text())
        if d:
            self.dir_edit.setText(d)

    def _fmt_changed(self, name: str):
        self.q_slider.setEnabled(OUTPUT_FORMATS[name] in (".jpg", ".webp", ".png"))

    def _update_size(self):
        w, h = self._size
        s = self.scale.value() / 100.0
        self.size_label.setText(f"{w} × {h}  →  {max(1, round(w * s))} × {max(1, round(h * s))} px")

    def _accept(self):
        d, n = self.dir_edit.text().strip(), self.name_edit.text().strip()
        if not n or not os.path.isdir(d):
            QMessageBox.warning(self, "Export", "Nama file kosong atau folder tidak ditemukan.")
            return
        ext = OUTPUT_FORMATS[self.fmt.currentText()]
        stem = os.path.splitext(n)[0]
        path = os.path.join(d, stem + ext)
        if os.path.exists(path):
            r = QMessageBox.question(self, "Timpa file?", f"'{os.path.basename(path)}' sudah ada.\nTimpa file tersebut?")
            if r != QMessageBox.Yes:
                return
        self.path = path
        self.accept()

    def values(self) -> dict:
        return {"path": self.path, "quality": self.q_slider.value(), "scale": self.scale.value() / 100.0}


# ======================================================================================
class BatchDialog(QDialog):
    def __init__(self, parent, pipeline_steps: list, method_step, default_dir: str):
        super().__init__(parent)
        self.setWindowTitle("Batch Processing")
        self.setMinimumSize(640, 620)
        self.worker = None
        self.files: list[str] = []
        self._pipeline, self._method_step = pipeline_steps, method_step

        lay = QVBoxLayout(self)
        lay.setSpacing(10)

        g1 = QGroupBox("1. Gambar")
        l1 = QVBoxLayout(g1)
        r = QHBoxLayout()
        b1 = QPushButton("Pilih Gambar…")
        b1.clicked.connect(self._pick_files)
        b2 = QPushButton("Import Folder…")
        b2.clicked.connect(self._pick_folder)
        b3 = QPushButton("Kosongkan")
        b3.clicked.connect(self._clear)
        for b in (b1, b2, b3):
            r.addWidget(b)
        r.addStretch(1)
        l1.addLayout(r)
        self.file_list = QListWidget()
        self.file_list.setMaximumHeight(110)
        l1.addWidget(self.file_list)
        lay.addWidget(g1)

        g2 = QGroupBox("2. Metode Pemrosesan")
        l2 = QVBoxLayout(g2)
        self.rb_pipe = QRadioButton(f"Pipeline saat ini ({len(pipeline_steps)} langkah aktif)")
        name = P.METHODS[method_step.method_id].name if method_step else "-"
        self.rb_method = QRadioButton(f"Metode aktif: {name} (dengan parameter saat ini)")
        grp = QButtonGroup(self)
        grp.addButton(self.rb_pipe)
        grp.addButton(self.rb_method)
        self.rb_pipe.setEnabled(bool(pipeline_steps))
        self.rb_method.setEnabled(method_step is not None)
        (self.rb_pipe if pipeline_steps else self.rb_method).setChecked(True)
        l2.addWidget(self.rb_pipe)
        l2.addWidget(self.rb_method)
        lay.addWidget(g2)

        g3 = QGroupBox("3. Output")
        f3 = QFormLayout(g3)
        row = QHBoxLayout()
        self.out_edit = QLineEdit(default_dir)
        bb = QPushButton("Browse…")
        bb.clicked.connect(self._pick_out)
        row.addWidget(self.out_edit, 1)
        row.addWidget(bb)
        f3.addRow("Folder output", row)
        self.fmt = QComboBox()
        self.fmt.addItems(list(OUTPUT_FORMATS))
        f3.addRow("Format", self.fmt)
        self.quality = QSpinBox()
        self.quality.setRange(1, 100)
        self.quality.setValue(95)
        f3.addRow("Kualitas (JPG/WEBP/PNG)", self.quality)
        self.suffix = QLineEdit("_processed")
        f3.addRow("Akhiran nama file", self.suffix)
        lay.addWidget(g3)

        self.progress = QProgressBar()
        self.progress.setTextVisible(False)
        lay.addWidget(self.progress)
        self.log = QListWidget()
        lay.addWidget(self.log, 1)
        self.summary = QLabel("")
        lay.addWidget(self.summary)

        row = QHBoxLayout()
        row.addStretch(1)
        self.btn_close = QPushButton("Tutup")
        self.btn_close.clicked.connect(self.close)
        self.btn_cancel = QPushButton("Batalkan")
        self.btn_cancel.setEnabled(False)
        self.btn_cancel.clicked.connect(self._cancel)
        self.btn_start = QPushButton("Start Batch Processing")
        self.btn_start.setObjectName("apply")
        self.btn_start.clicked.connect(self._start)
        for b in (self.btn_close, self.btn_cancel, self.btn_start):
            row.addWidget(b)
        lay.addLayout(row)

    # -- pemilihan file ------------------------------------------------------------------------
    def _refresh_files(self):
        self.file_list.clear()
        for f in self.files:
            self.file_list.addItem(os.path.basename(f))
        self.summary.setText(f"{len(self.files)} gambar dipilih.")

    def _pick_files(self):
        files, _ = QFileDialog.getOpenFileNames(self, "Pilih gambar", "", OPEN_FILTER)
        if files:
            self.files = sorted(set(self.files) | set(files))
            self._refresh_files()

    def _pick_folder(self):
        d = QFileDialog.getExistingDirectory(self, "Pilih folder berisi gambar")
        if d:
            self.files = sorted(set(self.files) | set(list_images(d)))
            self._refresh_files()

    def _clear(self):
        self.files = []
        self._refresh_files()

    def _pick_out(self):
        d = QFileDialog.getExistingDirectory(self, "Pilih folder output", self.out_edit.text())
        if d:
            self.out_edit.setText(d)

    # -- eksekusi ------------------------------------------------------------------------------
    def _set_running(self, running: bool):
        self.btn_start.setEnabled(not running)
        self.btn_cancel.setEnabled(running)
        self.btn_close.setEnabled(not running)

    def _start(self):
        if not self.files:
            QMessageBox.information(self, "Batch", "Pilih gambar atau folder terlebih dahulu.")
            return
        out = self.out_edit.text().strip()
        if not out:
            QMessageBox.information(self, "Batch", "Pilih folder output.")
            return
        steps = self._pipeline if self.rb_pipe.isChecked() else [self._method_step]
        self.log.clear()
        self.progress.setRange(0, len(self.files))
        self.progress.setValue(0)
        self.worker = BatchWorker(self.files, steps, out, OUTPUT_FORMATS[self.fmt.currentText()],
                                  self.quality.value(), self.suffix.text())
        self.worker.progress.connect(self._on_progress)
        self.worker.done.connect(self._on_done)
        self._set_running(True)
        self.worker.start()

    def _cancel(self):
        if self.worker:
            self.worker.cancel()

    def _on_progress(self, i, total, name, ok, msg):
        self.progress.setValue(i)
        it = QListWidgetItem(f"✔  {name}  →  {msg}" if ok else f"✘  {name}  —  {msg}")
        self.log.addItem(it)
        self.log.scrollToBottom()

    def _on_done(self, s):
        self._set_running(False)
        txt = f"Selesai: {s['success']} berhasil, {len(s['failed'])} gagal dari {s['total']} gambar."
        if s["cancelled"]:
            txt = "Dibatalkan. " + txt
        self.summary.setText(txt)

    def closeEvent(self, e):
        if self.worker and self.worker.isRunning():
            self.worker.cancel()
            self.worker.wait(5000)
        super().closeEvent(e)


# ======================================================================================
class DocDialog(QDialog):
    """Algorithm Documentation: daftar seluruh metode dengan penjelasannya."""

    def __init__(self, parent, methods: list, select_id: str | None = None):
        super().__init__(parent)
        self.setWindowTitle("Algorithm Documentation")
        self.resize(900, 600)
        lay = QVBoxLayout(self)
        sp = QSplitter()
        lay.addWidget(sp)
        self.lst = QListWidget()
        self._methods = {}
        for cat in P.CATEGORIES:
            h = QListWidgetItem(cat.upper())
            h.setFlags(Qt.NoItemFlags)
            self.lst.addItem(h)
            for m in P.methods_in(cat):
                it = QListWidgetItem("   " + m.name)
                it.setData(Qt.UserRole, m.id)
                self.lst.addItem(it)
                self._methods[m.id] = m
        self.view = QTextBrowser()
        sp.addWidget(self.lst)
        sp.addWidget(self.view)
        sp.setSizes([250, 650])
        self.lst.currentItemChanged.connect(self._sel)
        for i in range(self.lst.count()):
            it = self.lst.item(i)
            if it.data(Qt.UserRole) == (select_id or "Basic Processing/Grayscale"):
                self.lst.setCurrentItem(it)
                break

    def _sel(self, cur, _prev):
        if cur is not None and cur.data(Qt.UserRole):
            self.view.setHtml(info_html(self._methods[cur.data(Qt.UserRole)]))


GUIDE_HTML = """
<h2>Pixora — User Guide</h2>
<h3>Alur kerja</h3>
<ol>
<li><b>Buka gambar</b>: File → Open Image (Ctrl+O), drag &amp; drop ke panel kiri, atau buka kamera.</li>
<li><b>Pilih metode</b> pada sidebar kiri (atau menu Processing). Pemilihan metode <u>tidak</u> memproses gambar.</li>
<li><b>Atur parameter</b> di panel kanan. Perubahan parameter hanya mengubah nilai; indikator <i>Pending changes</i> muncul.</li>
<li>Tekan <b>Apply</b> (Ctrl+Enter) untuk menjalankan metode. Hasil tampil di panel kanan dan masuk ke History.</li>
<li><b>Bandingkan</b> dengan zoom/pan tersinkron, atau tombol “Peek Original”.</li>
<li><b>Simpan</b>: File → Save Result / Save As / Export.</li>
</ol>
<h3>Apply on previous result</h3>
<p>Jika dicentang, operasi diterapkan pada hasil sebelumnya (rantai pemrosesan). Jika tidak, operasi diterapkan pada gambar asli dan memulai rantai baru.</p>
<h3>History &amp; Pipeline</h3>
<p>Undo/Redo memindahkan posisi di History. Pada dock <b>Pipeline</b> Anda dapat menonaktifkan, menghapus, mengurutkan ulang (drag), menyimpan/memuat, dan menjalankan ulang rangkaian metode dari gambar asli.</p>
<h3>Kamera</h3>
<p>Camera → Open Camera menampilkan live preview <i>tanpa</i> pemrosesan serta membuka histogram live di dock <b>Analysis</b>. Pilih metode, atur parameter, tekan Apply untuk memulai Live Processing; Stop Processing menghentikannya tanpa menutup kamera. Perubahan parameter saat live baru berlaku setelah Apply ditekan lagi. Capture menjadikan frame sebagai gambar statis.</p>
<h3>Histogram &amp; Analisis</h3>
<p>Grayscale Histogram dan RGB Histogram adalah fitur analisis: histogram dihitung otomatis setiap Apply, tampil di dock <b>Analysis</b> saat fitur dipilih, dan diperbarui secara live saat kamera aktif; tidak mengubah gambar. Ganti sumber (Original atau Processed) dan histogram langsung berubah tanpa Apply.</p>
<h3>Batch</h3>
<p>File → Batch Processing memproses banyak gambar dengan pipeline atau metode aktif. Gambar yang gagal tidak menghentikan batch.</p>
"""