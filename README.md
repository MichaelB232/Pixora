# Pixora – Desktop Image Processing Studio

Aplikasi desktop pengolahan citra digital (Python · PySide6 · OpenCV) sesuai PRD v2.0.
Prinsip utama: **Apply-Based Processing** – tidak ada pemrosesan tanpa tombol Apply.

## Menjalankan

```bash
pip install -r requirements.txt
python main.py            # atau: python main.py gambar.jpg
```

## Build `.exe` (Windows)

```
build_exe.bat          # hasil: dist\Pixora\Pixora.exe (tanpa konsol)
build_exe.bat debug    # dengan konsol, untuk melihat pesan error
```

Skrip membuat virtualenv bersih `.venv-build` lalu membangun dengan PyInstaller (± 450 MB, wajar karena
membawa Qt dan OpenCV). Bagikan **seluruh folder** `dist\Pixora`, bukan hanya `Pixora.exe`.

Jika aplikasi hasil build langsung tertutup, bangun ulang dengan `build_exe.bat debug` dan baca pesan errornya.
Jika errornya menyebut `pkg_resources` / `platformdirs`, tambahkan `--exclude-module pkg_resources` pada perintah
PyInstaller di `build_exe.bat`. Checklist uji manual sebelum dikumpulkan: [docs/uji-manual-windows.md](docs/uji-manual-windows.md).

## Struktur proyek

| File | Isi |
|---|---|
| `main.py` | Main window, workspace dual-panel, menu, alur Apply/History/Pipeline/Kamera/Save |
| `processing.py` | Processing engine: registry 12 algoritma + 2 analisis histogram + pipeline runner |
| `algorithms/` | Implementasi manual (pure NumPy, tanpa cv2) tiap algoritma terisolasi dalam modul/fungsi sendiri |
| `widgets.py` | ImageView (zoom/pan/sync), panel parameter dinamis, panel analisis (histogram) |
| `dialogs.py` | Export, Batch Processing, Algorithm Documentation, User Guide |
| `workers.py` | Thread pemrosesan, kamera (frame capture terpisah), batch |
| `history.py` | Processing History + Undo/Redo + konversi ke pipeline |
| `fileio.py` | Baca/tulis gambar (aman path Unicode), info file |
| `info.py` | Informasi edukasi tiap algoritma |
| `theme.py` | Dark mode (default) & light mode |

## Cara memakai

1. Buka gambar (Ctrl+O / drag & drop) atau **Open Camera**.
2. Pilih metode di sidebar kiri → atur parameter di panel kanan (belum memproses; muncul *Pending changes*).
3. Tekan **Apply** (Ctrl+Enter). Hasil muncul di panel kanan dan tercatat di History.
4. Bandingkan (zoom/pan tersinkron, *Peek Original*), lalu **Save / Export**.

Catatan perilaku:
- **Apply on previous result** (kanan bawah): aktif = berantai pada hasil sebelumnya; nonaktif = dari gambar asli.
- **Grayscale/RGB Histogram** adalah analisis: tampil di dock *Analysis*, tidak mengubah gambar, tidak masuk History.
- **Kamera**: preview normal tanpa pemrosesan; Live Processing baru jalan setelah Apply; ubah parameter butuh Apply lagi; *Stop Processing* tidak menutup kamera. Resolusi kamera: menu Camera → Resolution.
- **Pipeline** (dock): centang aktif/nonaktif, drag untuk urut ulang, Delete Step, Save/Load JSON, Run Pipeline, Batch.
- **Canny**: magnitudo gradien memakai norma L2, jadi threshold default 50/150 (bukan 100/200 seperti contoh OpenCV yang memakai norma L1).
- Batas History: 40 entri terakhir (menjaga memori).

## Cakupan saat ini

Ruang lingkup sengaja dipangkas dari rancangan awal (60 metode) menjadi **14 metode** yang ditulis manual
dengan NumPy:

| Kategori | Metode |
|---|---|
| Basic Processing | Grayscale, Negative, Binary Threshold, Adaptive Threshold, Otsu Threshold |
| Histogram | Grayscale Histogram, RGB Histogram (analisis), Histogram Equalization |
| Enhancement | Brightness, Contrast, Sharpening (Unsharp Mask / Laplacian) |
| Filtering | Blur (Gaussian / Mean) |
| Edge Detection | Sobel, Canny |

Infrastruktur aplikasi: dual-panel + sync zoom/pan + toggle original/processed, Apply/Reset/Reset Result,
status pemrosesan (Idle/Configuring/Processing/Completed/Failed/Cancelled), kamera + capture + live processing,
History + Undo/Redo, Pipeline, Batch, Export (format, kualitas, resolusi, konfirmasi timpa), panel edukasi per
metode, worker thread, tema dark/light.

<!-- Kontribusi oleh Hasanrbn -->
