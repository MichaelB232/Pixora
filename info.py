"""Pixora - Educational Information System.

Setiap metode memiliki: deskripsi, tujuan, cara kerja manual (tanpa fungsi
instan cv2), rumus matematika, contoh penggunaan, dan output.
"""
from __future__ import annotations

# nama metode -> (deskripsi, tujuan, cara kerja, rumus, contoh penggunaan, output)
_RAW = {
    # ---------------- Basic Processing ----------------
    "Grayscale": (
        "Mengubah gambar berwarna (3 kanal BGR) menjadi citra dengan intensitas keabuan (1 kanal).",
        "Menyederhanakan representasi data warna menjadi satu nilai luminansi sebagai tahap pra-pemrosesan.",
        "Diimplementasikan secara manual di algorithms/grayscale.py: piksel diubah ke float32, dipisah menjadi kanal B, G, R, lalu dihitung rata-rata terbobot atau lightness sebelum dibulatkan ke uint8 [0-255].",
        "Y = 0.299R + 0.587G + 0.114B  (BT.601)\nY = 0.2126R + 0.7152G + 0.0722B  (BT.709)\nY = (R + G + B) / 3  (Average)",
        "Persiapan sebelum thresholding, Sobel edge detection, atau histogram equalization.",
        "Gambar grayscale 1-kanal intensitas [0-255]."),
    "Negative": (
        "Membalik nilai intensitas terang dan gelap pada setiap piksel citra.",
        "Memperjelas detail area terang pada latar gelap atau menghasilkan efek negatif film.",
        "Diimplementasikan secara manual di algorithms/negative.py: piksel diubah ke tipe int16 agar aman dari overflow, lalu setiap piksel dikurangkan dari intensitas maksimum 255.",
        "s = (L - 1) - r = 255 - r",
        "Analisis citra medis/radiografi atau pemeriksaan detail pada bayangan gelap.",
        "Gambar dengan nilai intensitas terbalik."),
    "Binary Threshold": (
        "Mengubah citra keabuan menjadi citra biner (hitam-putih) atau terpotong berdasarkan satu nilai ambang global T.",
        "Memisahkan objek utama dari latar belakang secara sederhana.",
        "Diimplementasikan secara manual di algorithms/binary_threshold.py: konversi ke grayscale BT.601, lalu setiap piksel dievaluasi dengan kondisi perbandingan (gray > T) menggunakan operasi vektor NumPy.",
        "dst(x,y) = max_val jika gray(x,y) > T, selain itu 0",
        "Threshold 127 pada dokumen atau objek dengan pencahayaan merata.",
        "Gambar biner / terpotong sesuai mode threshold."),
    "Adaptive Threshold": (
        "Pengambangan lokal di mana nilai ambang T(x,y) dihitung berbeda untuk tiap piksel berdasarkan tetangganya.",
        "Menangani foto dengan pencahayaan tidak merata (misalnya dokumen yang terkena bayangan).",
        "Diimplementasikan secara manual di algorithms/adaptive_threshold.py: hitung rata-rata lokal (Mean seragam atau Gaussian) pada jendela Block Size × Block Size lewat konvolusi separable, kurangi konstanta C untuk mendapat peta ambang T(x,y), lalu bandingkan piksel > T(x,y).",
        "T(x,y) = local_mean(x,y) - C\nout(x,y) = 255 jika gray(x,y) > T(x,y), else 0",
        "Memindai teks di kertas dengan bayangan di salah satu sisi.",
        "Gambar biner dengan detail lokal dan teks tetap terbaca."),
    "Otsu Threshold": (
        "Menentukan nilai threshold optimal T* secara otomatis dari analisis statistik histogram.",
        "Segmentasi objek-latar otomatis tanpa harus menebak angka threshold secara manual.",
        "Diimplementasikan secara manual di algorithms/otsu_threshold.py: hitung distribusi probabilitas histogram, lalu evaluasi seluruh kandidat ambang T ∈ [0..254] untuk mencari nilai T* yang memaksimalkan Between-Class Variance (varians antar-kelas).",
        "T* = argmax [ w0(T) · w1(T) · (μ0(T) - μ1(T))² ]",
        "Memisahkan objek gelap di atas latar terang dengan histogram bimodal.",
        "Gambar biner hasil segmentasi otomatis optimal."),
    # ---------------- Histogram ----------------
    "Grayscale Histogram": (
        "Grafik distribusi frekuensi intensitas keabuan (0-255).",
        "Melihat perubahan sebaran kecerahan dan kontras secara matematis sebelum dan sesudah pemrosesan.",
        "Diimplementasikan secara manual di algorithms/histogram.py: citra dikonversi ke grayscale BT.601 lalu dihitung jumlah kemunculan tiap nilai intensitas 0-255 dengan np.bincount (tanpa cv2.calcHist).",
        "h(k) = jumlah piksel dengan intensitas k,  k ∈ [0, 255]",
        "Bandingkan histogram Original vs Processed setelah Brightness atau Histogram Equalization.",
        "Grafik kurva histogram di panel Analysis (tidak mengubah gambar)."),
    "RGB Histogram": (
        "Grafik distribusi frekuensi intensitas tiga kanal warna (Red, Green, Blue) sekaligus.",
        "Menganalisis pergeseran distribusi tiap kanal warna akibat pemrosesan citra.",
        "Diimplementasikan secara manual di algorithms/histogram.py: menghitung frekuensi 0-255 secara terpisah untuk kanal Red, Green, dan Blue menggunakan np.bincount.",
        "h_c(k) = jumlah piksel kanal c dengan intensitas k,  c ∈ {R, G, B}",
        "Melihat pergeseran distribusi warna setelah Negative atau Brightness.",
        "Grafik tiga kurva warna di panel Analysis (tidak mengubah gambar)."),
    "Histogram Equalization": (
        "Meratakan distribusi intensitas piksel untuk meningkatkan kontras global gambar secara otomatis.",
        "Memperjelas gambar yang terlalu gelap, terlalu terang, atau memiliki kontras sempit (pucat/berkabut).",
        "Diimplementasikan secara manual di algorithms/equalization.py: hitung frekuensi tiap intensitas (0-255), hitung Cumulative Distribution Function (CDF), normalisasi CDF ke rentang [0,255] menjadi Look-Up Table (LUT), lalu petakan piksel. Pada mode warna, BGR dikonversi manual ke YCbCr (BT.601) agar hanya kanal luminansi Y yang diratakan.",
        "s_k = round( (CDF(k) - CDF_min) / (N - CDF_min) × 255 )",
        "Foto low-light atau citra berkabut agar detail lebih menonjol.",
        "Gambar dengan sebaran kontras lebih merata tanpa merusak warna."),
    # ---------------- Enhancement ----------------
    "Brightness": (
        "Menambah atau mengurangi tingkat kecerahan seluruh piksel secara linear.",
        "Mencerahkan citra yang kurang cahaya (under-exposed) atau meredupkan citra yang terlalu silau.",
        "Diimplementasikan secara manual di algorithms/brightness.py: operasi titik dengan mengonversi piksel ke float32, menambahkan konstanta bias β, lalu memotong (clamping) ke batas [0, 255] agar tidak terjadi wrap-around.",
        "s = clip(r + β, 0, 255)",
        "Brightness +25 untuk mencerahkan foto ruangan yang agak gelap.",
        "Gambar lebih terang atau lebih gelap."),
    "Contrast": (
        "Mengatur rentang perbedaan intensitas antara area terang dan area gelap secara linear.",
        "Menajamkan atau melembutkan kontras pada gambar yang terlihat pucat.",
        "Diimplementasikan secara manual di algorithms/contrast.py: nilai setiap piksel digeser terhadap titik tengah 128, dikalikan faktor skala persentase (pct/100), lalu digeser kembali ke +128 dan di-clip ke [0, 255].",
        "s = clip((r - 128) · (pct / 100) + 128, 0, 255)",
        "Contrast 140% untuk mempertegas pemisahan terang-gelap pada foto pucat.",
        "Gambar dengan rentang kontras yang melebar atau menyempit."),
    "Sharpening": (
        "Mempertajam detail tepi dan tekstur halus pada gambar.",
        "Mengurangi kesan buram ringan dan menegaskan batas antar-objek.",
        "Diimplementasikan secara manual di algorithms/sharpening.py: mendukung Unsharp Mask (mengekstrak detail frekuensi tinggi dari selisih gambar asli dikurangi hasil Gaussian blur manual, lalu ditambahkan kembali sebesar bobot α) dan Laplacian Kernel (konvolusi 2D manual dengan kernel 3×3 [[0,-α,0],[-α,1+4α,-α],[0,-α,0]]).",
        "Unsharp: out = img + α·(img - blur(img))\nLaplacian: K = [[0,-α,0],[-α,1+4α,-α],[0,-α,0]]",
        "Foto yang sedikit lembut/kurang fokus dengan Strength 100%.",
        "Gambar dengan tepi dan tekstur lebih tajam."),
    # ---------------- Filtering ----------------
    "Blur": (
        "Menghaluskan citra dan meredam noise dengan konvolusi spasial berbobot tetangga.",
        "Mengurangi derau (noise) acak atau menyiapkan citra sebelum deteksi tepi.",
        "Diimplementasikan secara manual di algorithms/blur.py: membangun kernel 1D Gaussian (exp(-x²/2σ²) ternormalisasi) atau Mean (1/k), lalu melakukan konvolusi separable horizontal & vertikal dengan edge padding.",
        "Gaussian: G(x) = exp(-x² / 2σ²) / ΣG\nMean: K(i,j) = 1 / k²",
        "Kernel Size 5 untuk menghaluskan bintik noise pada foto.",
        "Gambar yang lebih halus dan bersih dari noise."),
    # ---------------- Edge Detection ----------------
    "Sobel": (
        "Mendeteksi tepi objek dengan menghitung gradien perubahan intensitas orde pertama secara horizontal dan vertikal.",
        "Menemukan garis batas dan kontur struktur utama pada citra.",
        "Diimplementasikan secara manual di algorithms/sobel.py: konversi ke grayscale, konvolusi 2D manual dengan kernel Kx = [[-1,0,1],[-2,0,2],[-1,0,1]] dan Ky = [[-1,-2,-1],[0,0,0],[1,2,1]], hitung magnitudo √(Gx² + Gy²), lalu normalisasi min-max ke [0, 255].",
        "|G| = √(Gx² + Gy²)\nGx = I * Kx,   Gy = I * Ky",
        "Arah Both dengan Kernel Size 3 untuk mendeteksi seluruh tepi objek.",
        "Citra grayscale peta gradien tepi."),
}

CATEGORY_INFO = {
    "Basic Processing": "Operasi dasar intensitas piksel (Grayscale, Negative, Thresholding).",
    "Histogram": "Pemerataan distribusi intensitas piksel (Equalization).",
    "Enhancement": "Penyesuaian kecerahan dan penajaman detail citra.",
    "Filtering": "Konvolusi spasial untuk penghalusan dan peredaman noise.",
    "Edge Detection": "Pendeteksian tepi menggunakan operator gradien Sobel.",
}

_KEYS = ("description", "purpose", "how", "formula", "example", "output")


def get_info(name: str) -> dict:
    raw = _RAW.get(name)
    if raw is None:
        return {k: "-" for k in _KEYS}
    return dict(zip(_KEYS, raw))


def info_html(method) -> str:
    """HTML ringkas untuk panel informasi metode (nama, kategori, penjelasan, parameter)."""
    i = get_info(method.name)
    if method.params:
        items = "".join(f"<li>{p.label}</li>" for p in method.params)
        params = f"<ul style='margin:2px 0 6px 14px;padding:0'>{items}</ul>"
    else:
        params = "<p style='margin:2px 0 6px 0'>Tidak ada parameter.</p>"
    formula = i["formula"].replace("\n", "<br>")
    kind = "Analisis (tidak mengubah gambar)" if method.kind == "analysis" else "Pemrosesan citra (NumPy Manual)"
    return (
        f"<h3 style='margin:0'>{method.name}</h3>"
        f"<p style='color:#8a8f9c;margin:0 0 6px 0'>{method.category} · {kind}</p>"
        f"<p><b>Deskripsi</b><br>{i['description']}</p>"
        f"<p><b>Tujuan</b><br>{i['purpose']}</p>"
        f"<p><b>Cara Kerja (Implementasi Manual)</b><br>{i['how']}</p>"
        f"<p><b>Rumus</b><br><code>{formula}</code></p>"
        f"<p><b>Parameter</b>{params}</p>"
        f"<p><b>Contoh Penggunaan</b><br>{i['example']}</p>"
        f"<p><b>Output</b><br>{i['output']}</p>"
    )
