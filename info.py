"""Pixora - Educational Information System.

Setiap metode memiliki: deskripsi, tujuan, cara kerja, rumus/contoh, contoh penggunaan, dan output.
"""
from __future__ import annotations

# nama metode -> (deskripsi, tujuan, cara kerja, rumus, contoh penggunaan, output)
_RAW = {
    # ---------------- Basic Processing ----------------
    "Grayscale": (
        "Mengubah gambar berwarna menjadi gambar dengan intensitas keabuan.",
        "Menyederhanakan data (3 kanal menjadi 1) sebagai langkah awal banyak algoritma.",
        "Setiap piksel RGB dikonversi menjadi satu nilai intensitas berdasarkan kontribusi tiap kanal warna.",
        "Y = 0.299R + 0.587G + 0.114B  (BT.601)\nY = 0.2126R + 0.7152G + 0.0722B  (BT.709)",
        "Persiapan sebelum threshold, edge detection, atau segmentasi.",
        "Gambar grayscale satu kanal intensitas."),
    "Negative": (
        "Membalik nilai intensitas setiap piksel.",
        "Memperjelas detail terang pada area gelap, atau efek negatif film.",
        "Setiap nilai piksel dikurangkan dari nilai maksimum (255).",
        "s = 255 - r",
        "Analisis citra medis/radiografi.",
        "Gambar dengan terang-gelap terbalik."),
    "Binary Threshold": (
        "Mengubah citra menjadi hitam putih berdasarkan satu nilai ambang.",
        "Memisahkan objek dari latar belakang.",
        "Piksel dengan intensitas di atas threshold diberi Max Value, selain itu 0.",
        "dst(x,y) = maxval jika src(x,y) > T, selain itu 0",
        "Threshold 127 pada gambar dokumen.",
        "Gambar biner (hitam/putih)."),
    "Adaptive Threshold": (
        "Threshold dengan nilai ambang yang dihitung per area lokal.",
        "Menangani pencahayaan tidak merata (mis. foto dokumen dengan bayangan).",
        "Untuk tiap piksel, ambang = rata-rata (atau Gaussian-weighted mean) tetangga Block Size x Block Size dikurangi C.",
        "T(x,y) = mean_lokal(x,y) - C",
        "Foto kertas yang terkena bayangan.",
        "Gambar biner dengan detail lokal terjaga."),
    "Otsu Threshold": (
        "Menentukan nilai threshold optimal secara otomatis dari histogram.",
        "Segmentasi tanpa perlu menebak nilai threshold.",
        "Mencari T yang memaksimalkan varians antar-kelas (latar vs objek) pada histogram bimodal.",
        "T* = argmax [ w0(T)·w1(T)·(μ0(T) - μ1(T))² ]",
        "Memisahkan objek gelap di atas latar terang.",
        "Gambar biner dengan threshold otomatis."),
    "Sepia": (
        "Memberi efek warna coklat kekuningan seperti foto lawas.",
        "Efek artistik/vintage.",
        "Setiap piksel dikalikan matriks sepia lalu dicampur dengan gambar asli sesuai Intensity.",
        "R' = 0.393R + 0.769G + 0.189B\nG' = 0.349R + 0.686G + 0.168B\nB' = 0.272R + 0.534G + 0.131B",
        "Foto bergaya vintage.",
        "Gambar berwarna sepia."),
    "Channel Extraction": (
        "Memisahkan/menampilkan kanal warna tertentu.",
        "Mempelajari kontribusi tiap kanal warna.",
        "Kanal yang tidak dipilih diset 0; kanal terpilih dipertahankan.",
        "out_c = in_c jika c dipilih, selain itu 0",
        "Hanya kanal Red untuk melihat distribusi warna merah.",
        "Gambar dengan kanal terpilih saja."),
    "Color to Binary": (
        "Mengubah citra berwarna menjadi biner lewat grayscale lalu threshold.",
        "Jalan pintas konversi warna → hitam putih.",
        "Konversi ke grayscale, lalu terapkan threshold biner.",
        "bin = (Y > T) ? 255 : 0",
        "Membuat mask sederhana dari foto.",
        "Gambar biner."),
    # ---------------- Histogram ----------------
    "Grayscale Histogram": (
        "Grafik distribusi intensitas keabuan (0-255).",
        "Menilai kecerahan dan kontras gambar.",
        "Menghitung jumlah piksel untuk setiap level intensitas.",
        "h(k) = jumlah piksel dengan intensitas k",
        "Histogram condong ke kiri = gambar gelap.",
        "Grafik histogram (tidak mengubah gambar)."),
    "RGB Histogram": (
        "Histogram tiga kanal warna sekaligus.",
        "Menganalisis keseimbangan warna.",
        "Histogram dihitung terpisah untuk kanal R, G, dan B.",
        "h_c(k), c ∈ {R,G,B}",
        "Mendeteksi dominasi warna (color cast).",
        "Grafik tiga kurva (tidak mengubah gambar)."),
    "Red Histogram": ("Histogram kanal merah.", "Analisis kanal merah.", "Menghitung frekuensi nilai 0-255 pada kanal R.", "h_R(k)", "Memeriksa saturasi kanal merah.", "Grafik histogram merah."),
    "Green Histogram": ("Histogram kanal hijau.", "Analisis kanal hijau.", "Menghitung frekuensi nilai 0-255 pada kanal G.", "h_G(k)", "Memeriksa distribusi hijau.", "Grafik histogram hijau."),
    "Blue Histogram": ("Histogram kanal biru.", "Analisis kanal biru.", "Menghitung frekuensi nilai 0-255 pada kanal B.", "h_B(k)", "Memeriksa distribusi biru.", "Grafik histogram biru."),
    "Histogram Equalization": (
        "Meratakan distribusi intensitas untuk meningkatkan kontras.",
        "Memperjelas gambar yang kontrasnya rendah.",
        "Memetakan intensitas dengan fungsi distribusi kumulatif (CDF) histogram.",
        "s_k = round( (L-1) · CDF(r_k) )",
        "Foto berkabut atau terlalu gelap.",
        "Gambar dengan kontras lebih merata."),
    "CLAHE": (
        "Equalization adaptif yang dibatasi kontrasnya (Contrast Limited AHE).",
        "Meningkatkan kontras lokal tanpa memperbesar noise secara berlebihan.",
        "Gambar dibagi menjadi tile; tiap tile di-equalize dengan histogram yang dipotong pada Clip Limit.",
        "histogram dipotong di clip limit lalu CDF per tile",
        "Citra medis / foto low-light.",
        "Gambar dengan kontras lokal lebih baik."),
    "Pixel Inspector": (
        "Melihat nilai piksel pada posisi kursor.",
        "Memeriksa nilai RGB/Gray/HSV titik tertentu.",
        "Setelah diaktifkan (Apply), arahkan kursor ke gambar; nilai ditampilkan di panel analisis.",
        "-",
        "Mengecek nilai threshold yang cocok.",
        "Teks nilai piksel (tidak mengubah gambar)."),
    "Image Statistics": (
        "Ringkasan statistik citra.",
        "Memahami karakteristik numerik gambar.",
        "Menghitung mean, standar deviasi, min, max, median tiap kanal, serta entropi.",
        "H = -Σ p(k)·log2 p(k)",
        "Membandingkan gambar sebelum dan sesudah proses.",
        "Tabel statistik (tidak mengubah gambar)."),
    # ---------------- Enhancement ----------------
    "Brightness": (
        "Menambah/mengurangi kecerahan.", "Mencerahkan atau menggelapkan gambar.",
        "Menambahkan konstanta pada semua piksel lalu dipotong ke 0-255.", "out = clip(in + b)",
        "Brightness +25 untuk foto agak gelap.", "Gambar lebih terang/gelap."),
    "Contrast": (
        "Mengatur perbedaan terang-gelap.", "Menajamkan atau melembutkan kontras.",
        "Nilai piksel diregangkan terhadap titik tengah 128.", "out = clip((in - 128)·c + 128)",
        "Contrast 130% untuk gambar pucat.", "Gambar dengan kontras berubah."),
    "Saturation": (
        "Mengatur kekuatan warna.", "Membuat warna lebih hidup atau pudar.",
        "Konversi ke HSV, kanal S dikalikan faktor, lalu kembali ke BGR.", "S' = clip(S · k)",
        "0% menghasilkan grayscale.", "Gambar dengan saturasi berubah."),
    "Hue": (
        "Menggeser rona warna.", "Mengubah warna dominan.",
        "Kanal H pada HSV digeser secara melingkar.", "H' = (H + Δ) mod 360°",
        "Mengubah langit biru menjadi kehijauan.", "Gambar dengan rona bergeser."),
    "Gamma Correction": (
        "Koreksi non-linear pencahayaan.", "Mencerahkan tone gelap tanpa memutihkan area terang.",
        "Setiap intensitas dipangkatkan 1/gamma (lewat Look-Up Table).", "out = 255·(in/255)^(1/γ)",
        "γ > 1 mencerahkan, γ < 1 menggelapkan.", "Gambar dengan tone tengah berubah."),
    "Exposure": (
        "Mensimulasikan perubahan eksposur kamera.", "Memperbaiki foto under/over-exposed.",
        "Piksel dikalikan 2^EV.", "out = clip(in · 2^EV)", "EV +1 = dua kali lebih terang.", "Gambar dengan eksposur baru."),
    "Sharpness": (
        "Mempertajam detail tepi.", "Membuat gambar lebih tajam.",
        "Unsharp masking: gambar asli ditambah selisih terhadap versi blur.", "out = in + k·(in - blur(in))",
        "Foto sedikit buram.", "Gambar lebih tajam."),
    "Color Temperature": (
        "Menggeser keseimbangan warna hangat/dingin.", "Mengoreksi white balance.",
        "Warm: tambah kanal R, kurangi B. Cool: sebaliknya.", "R' = R + d,  B' = B - d",
        "Foto indoor kekuningan → dinginkan.", "Gambar lebih hangat/dingin."),
    "Vibrance": (
        "Menguatkan warna yang masih pucat lebih banyak daripada yang sudah jenuh.", "Meningkatkan warna tanpa over-saturasi.",
        "Faktor saturasi lebih besar pada piksel dengan S rendah.", "S' = S·(1 + k·(1 - S/255))",
        "Potret kulit alami dengan latar lebih hidup.", "Gambar warna lebih hidup."),
    "Combined Adjustment": (
        "Brightness, Contrast, Saturation, Hue, dan Gamma sekaligus.", "Mengatur beberapa parameter dalam satu Apply.",
        "Urutan: contrast → brightness → gamma → saturation → hue.", "out = hue(sat(gamma(bright(contrast(in)))))",
        "Brightness +25, Contrast 130%, Saturation 115%.", "Gambar dengan semua penyesuaian."),
    # ---------------- Filtering ----------------
    "Mean Filter": (
        "Menghaluskan dengan rata-rata piksel tetangga.", "Mengurangi noise acak ringan.",
        "Kernel k×k berisi bobot sama dikonvolusikan ke gambar.", "g(x,y) = (1/k²) Σ f(i,j)",
        "Kernel 5×5.", "Gambar lebih halus/blur."),
    "Gaussian Blur": (
        "Blur dengan bobot Gaussian.", "Mengurangi noise dengan hasil lebih alami.",
        "Piksel dekat pusat kernel diberi bobot lebih besar.", "G(x,y) = (1/2πσ²)·e^(-(x²+y²)/2σ²)",
        "Pra-proses sebelum Canny.", "Gambar halus."),
    "Median Filter": (
        "Mengganti piksel dengan median tetangganya.", "Menghilangkan noise salt-and-pepper.",
        "Nilai piksel di jendela k×k diurutkan; diambil nilai tengah.", "g(x,y) = median{ f(i,j) }",
        "Foto dengan bintik hitam-putih.", "Gambar bersih dari noise impuls dengan tepi terjaga."),
    "Bilateral Filter": (
        "Smoothing yang menjaga tepi.", "Menghaluskan area datar tanpa mengaburkan tepi objek.",
        "Bobot bergantung pada jarak spasial dan selisih intensitas.", "w = exp(-d²/2σs²)·exp(-ΔI²/2σc²)",
        "Haluskan kulit pada potret.", "Gambar halus dengan tepi tajam."),
    "Min Filter": (
        "Mengambil nilai minimum tetangga.", "Memperbesar area gelap / menghilangkan noise terang.",
        "Nilai terkecil dalam jendela k×k dipilih.", "g = min{ f(i,j) }", "Menghapus bintik putih kecil.", "Gambar dengan area gelap melebar."),
    "Max Filter": (
        "Mengambil nilai maksimum tetangga.", "Memperbesar area terang / menghilangkan noise gelap.",
        "Nilai terbesar dalam jendela k×k dipilih.", "g = max{ f(i,j) }", "Menghapus bintik hitam kecil.", "Gambar dengan area terang melebar."),
    "Box Blur": (
        "Blur kotak dengan bobot seragam.", "Blur cepat dan sederhana.",
        "Menjumlah piksel dalam kotak (dinormalisasi jika Normalize aktif).", "g = (1/k²) Σ f",
        "Efek blur ringan.", "Gambar blur."),
    # ---------------- Edge Detection ----------------
    "Sobel": (
        "Mendeteksi tepi lewat gradien orde pertama.", "Menemukan perubahan intensitas horizontal/vertikal.",
        "Konvolusi dengan kernel Sobel arah X dan Y, lalu hitung magnitudo.", "|G| = √(Gx² + Gy²)",
        "Arah X menonjolkan tepi vertikal.", "Gambar tepi (grayscale)."),
    "Prewitt": (
        "Operator gradien sederhana.", "Mendeteksi tepi dengan kernel seragam.",
        "Konvolusi kernel Prewitt arah X dan Y.", "Gx = [[1,0,-1],[1,0,-1],[1,0,-1]]",
        "Perbandingan dengan Sobel.", "Gambar tepi."),
    "Laplacian": (
        "Deteksi tepi dengan turunan kedua.", "Menemukan tepi ke segala arah sekaligus.",
        "Konvolusi kernel Laplacian; tepi berada di perubahan tanda (zero-crossing).", "∇²f = ∂²f/∂x² + ∂²f/∂y²",
        "Deteksi detail halus (sensitif noise).", "Gambar tepi."),
    "Canny": (
        "Deteksi tepi bertahap dan akurat.", "Mendapatkan tepi tipis dan bersih.",
        "Blur → gradien → non-maximum suppression → hysteresis threshold (T1, T2).", "tepi kuat > T2, tepi lemah antara T1 dan T2 jika terhubung",
        "T1=100, T2=200.", "Gambar biner garis tepi."),
    "Scharr": (
        "Gradien dengan akurasi rotasi lebih baik dari Sobel 3×3.", "Deteksi tepi presisi.",
        "Konvolusi kernel Scharr arah X/Y.", "Gx = [[3,0,-3],[10,0,-10],[3,0,-3]]",
        "Perbandingan dengan Sobel.", "Gambar tepi."),
    # ---------------- Morphology ----------------
    "Erosion": (
        "Mengikis batas objek.", "Menghilangkan noise kecil dan memisahkan objek yang bersentuhan.",
        "Piksel dipertahankan hanya jika seluruh kernel berada di dalam objek (minimum lokal).", "A ⊖ B",
        "Citra biner dengan titik-titik noise.", "Objek mengecil."),
    "Dilation": (
        "Memperluas objek.", "Menutup celah kecil dan menebalkan objek.",
        "Piksel menjadi objek jika ada tumpang tindih dengan kernel (maksimum lokal).", "A ⊕ B",
        "Menyambung garis putus.", "Objek membesar."),
    "Opening": (
        "Erosi diikuti dilasi.", "Menghilangkan noise kecil dengan menjaga ukuran objek.",
        "Erode lalu dilate dengan kernel sama.", "A ∘ B = (A ⊖ B) ⊕ B", "Bersihkan bintik putih.", "Gambar bersih dari noise kecil."),
    "Closing": (
        "Dilasi diikuti erosi.", "Menutup lubang/celah kecil di dalam objek.",
        "Dilate lalu erode dengan kernel sama.", "A • B = (A ⊕ B) ⊖ B", "Menutup lubang hitam kecil.", "Objek tanpa lubang kecil."),
    "Morphological Gradient": (
        "Selisih dilasi dan erosi.", "Menampilkan batas objek.",
        "Dilation - Erosion.", "grad = (A ⊕ B) - (A ⊖ B)", "Outline objek.", "Gambar kontur objek."),
    "Top Hat": (
        "Selisih gambar dan opening.", "Menonjolkan objek terang kecil pada latar gelap/tak rata.",
        "Gambar asli dikurangi hasil opening.", "TH = A - (A ∘ B)", "Koreksi pencahayaan tidak merata.", "Objek terang kecil menonjol."),
    "Black Hat": (
        "Selisih closing dan gambar.", "Menonjolkan objek gelap kecil pada latar terang.",
        "Hasil closing dikurangi gambar asli.", "BH = (A • B) - A", "Mendeteksi retakan gelap.", "Objek gelap kecil menonjol."),
    # ---------------- Segmentation ----------------
    "Threshold Segmentation": (
        "Memisahkan objek berdasarkan intensitas.", "Segmentasi sederhana.",
        "Piksel di atas threshold menjadi objek.", "mask = (Y > T)", "Memisahkan objek terang dari latar.", "Mask biner atau objek tersegmentasi."),
    "Otsu Segmentation": (
        "Segmentasi dengan threshold otomatis (Otsu).", "Segmentasi tanpa tuning manual.",
        "Gaussian blur → threshold Otsu.", "T* = argmax varians antar-kelas", "Objek dengan histogram bimodal.", "Mask biner atau objek tersegmentasi."),
    "Watershed": (
        "Segmentasi berbasis analogi topografi.", "Memisahkan objek yang saling bersentuhan.",
        "Distance transform menentukan marker objek; air 'dibanjiri' dari marker hingga bertemu di garis batas.", "marker = dist > α·max(dist)",
        "Memisahkan koin yang bersentuhan.", "Gambar dengan garis batas merah antar-objek."),
    "Contour Detection": (
        "Mendeteksi batas objek.", "Menghitung dan menandai objek.",
        "Gambar dibinerkan, lalu batas komponen putih ditelusuri.", "findContours(bin, mode, method)",
        "Menghitung jumlah objek.", "Gambar asli dengan kontur hijau."),
    "Connected Components": (
        "Mengidentifikasi komponen piksel yang terhubung.", "Melabeli dan menghitung objek terpisah.",
        "Piksel putih bertetangga (4/8 arah) diberi label yang sama.", "label(x,y) = id komponen",
        "Menghitung sel pada citra mikroskop.", "Gambar berwarna per komponen."),
    "Masking": (
        "Memisahkan area berdasarkan rentang warna HSV.", "Mengisolasi objek berwarna tertentu.",
        "Piksel dalam rentang HSV yang ditentukan menjadi mask.", "mask = inRange(HSV, low, high)",
        "Mengisolasi objek hijau (H 40-80).", "Gambar ter-mask atau mask biner."),
    # ---------------- Transformation ----------------
    "Resize": (
        "Mengubah dimensi gambar.", "Memperbesar/memperkecil gambar.",
        "Piksel baru dihitung dengan interpolasi.", "x' = x·sx,  y' = y·sy", "Perkecil 50%.", "Gambar berukuran baru."),
    "Rotate": (
        "Memutar gambar terhadap pusat.", "Meluruskan atau memutar gambar.",
        "Matriks rotasi 2×3 diterapkan lewat warpAffine.", "[x';y'] = R(θ)·[x;y]", "Rotasi 90°.", "Gambar terputar."),
    "Flip Horizontal": ("Membalik gambar kiri-kanan.", "Efek cermin.", "Kolom piksel dibalik urutannya.", "x' = W - 1 - x", "Mirror foto selfie.", "Gambar tercermin horizontal."),
    "Flip Vertical": ("Membalik gambar atas-bawah.", "Efek cermin vertikal.", "Baris piksel dibalik urutannya.", "y' = H - 1 - y", "Koreksi gambar terbalik.", "Gambar tercermin vertikal."),
    "Crop": (
        "Memotong area persegi.", "Fokus pada bagian penting.",
        "Mengambil sub-matriks [y:y+h, x:x+w].", "out = img[y:y+h, x:x+w]", "Potong wajah/objek.", "Gambar lebih kecil sesuai area."),
    "Translation": (
        "Menggeser gambar.", "Memindahkan posisi isi gambar.",
        "Matriks translasi diterapkan lewat warpAffine.", "[1 0 tx; 0 1 ty]", "Geser 50 px ke kanan.", "Gambar tergeser."),
    "Affine Transformation": (
        "Transformasi linear + translasi (skala, rotasi, shear).", "Distorsi geometris yang menjaga garis paralel.",
        "Matriks 2×3 [[a,b,tx],[c,d,ty]] diterapkan ke setiap koordinat.", "x' = a·x + b·y + tx\ny' = c·x + d·y + ty",
        "b = 0.3 untuk efek miring (shear).", "Gambar tertransformasi affine."),
    "Perspective Transformation": (
        "Transformasi perspektif 4 titik.", "Mengoreksi atau mensimulasikan sudut pandang.",
        "Homografi 3×3 dihitung dari 4 sudut sumber ke 4 sudut tujuan (digeser dalam %).", "[x';y';w'] = H·[x;y;1]",
        "Meluruskan foto dokumen miring.", "Gambar dengan perspektif baru."),
}

CATEGORY_INFO = {
    "Basic Processing": "Metode dasar untuk mengubah representasi dan intensitas citra.",
    "Histogram": "Analisis distribusi piksel dan pemerataan histogram.",
    "Enhancement": "Peningkatan kualitas dan penyesuaian tampilan.",
    "Filtering": "Penghalusan gambar dan pengurangan noise.",
    "Edge Detection": "Pendeteksian batas atau perubahan intensitas objek.",
    "Morphology": "Manipulasi bentuk objek, terutama pada citra biner.",
    "Segmentation": "Pemisahan objek, kontur, dan komponen terhubung.",
    "Transformation": "Transformasi geometris gambar.",
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
    params = ""
    if method.params:
        items = "".join(f"<li>{p.label}</li>" for p in method.params)
        params = f"<ul style='margin:2px 0 6px 14px;padding:0'>{items}</ul>"
    else:
        params = "<p style='margin:2px 0 6px 0'>Tidak ada parameter.</p>"
    formula = i["formula"].replace("\n", "<br>")
    kind = "Analisis (tidak mengubah gambar)" if method.kind == "analysis" else "Pemrosesan citra"
    return (
        f"<h3 style='margin:0'>{method.name}</h3>"
        f"<p style='color:#8a8f9c;margin:0 0 6px 0'>{method.category} · {kind}</p>"
        f"<p><b>Deskripsi</b><br>{i['description']}</p>"
        f"<p><b>Tujuan</b><br>{i['purpose']}</p>"
        f"<p><b>Cara Kerja</b><br>{i['how']}</p>"
        f"<p><b>Rumus</b><br><code>{formula}</code></p>"
        f"<p><b>Parameter</b>{params}</p>"
        f"<p><b>Contoh Penggunaan</b><br>{i['example']}</p>"
        f"<p><b>Output</b><br>{i['output']}</p>"
    )
