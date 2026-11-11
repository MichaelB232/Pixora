# MASTER PROJECT PLAN

# PIXORA

### Advanced Image Processing & Computer Vision Studio

**Platform:** Web application berbasis Streamlit\
**Programming Language:** Python\
**Framework Utama:** Streamlit\
**Core Library:** OpenCV, NumPy, Pillow, SciPy, scikit-image\
**Kategori:** Image Processing & Computer Vision\
**Tim:** 3 anggota\
**Target:** Sangat tinggi\
**Versi Dokumen:** 1.0\
**Status:** Project Planning & Technical Blueprint

------------------------------------------------------------------------

# 1. Project Overview

## 1.1 Deskripsi Proyek

PIXORA merupakan aplikasi pengolahan citra digital yang dirancang
sebagai platform terpadu untuk melakukan manipulasi, peningkatan
kualitas, restorasi, analisis, dan pemrosesan gambar menggunakan
berbagai algoritma Image Processing dan Computer Vision.

Aplikasi menyediakan berbagai modul pengolahan citra dalam satu sistem,
mulai dari operasi dasar seperti grayscale, brightness adjustment, dan
contrast enhancement hingga teknik yang lebih kompleks seperti image
segmentation, edge detection, image restoration, document detection, dan
perspective transformation.

PIXORA dikembangkan menggunakan Python dengan Streamlit sebagai
framework antarmuka pengguna serta OpenCV dan beberapa library pendukung
untuk implementasi algoritma pengolahan citra.

Pengguna dapat mengunggah gambar, memilih metode pemrosesan, mengatur
parameter, melihat hasil, membandingkan gambar sebelum dan sesudah
pemrosesan, serta mengunduh hasil akhir.

## 1.2 Latar Belakang

Pengolahan citra digital merupakan bidang informatika yang memanfaatkan
metode komputasi untuk memanipulasi dan menganalisis informasi visual.
Penerapannya dapat ditemukan dalam fotografi digital, kesehatan,
keamanan, industri, pengolahan dokumen, dan sistem kecerdasan buatan.

Berbagai kebutuhan pengolahan citra sering kali memerlukan aplikasi atau
perangkat berbeda. Peningkatan kualitas gambar, penghapusan noise,
deteksi objek, dan pemindaian dokumen memiliki pendekatan serta
algoritma yang berbeda.

PIXORA dikembangkan sebagai solusi terpadu yang menggabungkan berbagai
metode Image Processing dan Computer Vision dalam satu aplikasi yang
mudah digunakan serta dapat menjadi media pembelajaran dan demonstrasi
implementasi algoritma.

## 1.3 Tujuan Proyek

1.  Mengembangkan aplikasi pengolahan citra digital berbasis Python.
2.  Mengimplementasikan berbagai algoritma Image Processing.
3.  Menggabungkan metode peningkatan kualitas, restorasi, manipulasi,
    dan analisis citra dalam satu platform.
4.  Menyediakan antarmuka interaktif untuk mengatur parameter
    pemrosesan.
5.  Memungkinkan pengguna membandingkan hasil pemrosesan dengan gambar
    asli.
6.  Mengimplementasikan teknik Computer Vision untuk deteksi,
    segmentasi, dan analisis citra.
7.  Menyediakan fitur pengolahan dokumen digital melalui Document
    Scanner.
8.  Menguji efektivitas dan performa algoritma yang diimplementasikan.

## 1.4 Target Pengguna

-   Mahasiswa yang mempelajari Image Processing.
-   Pengguna yang membutuhkan pengolahan gambar digital.
-   Pengembang yang ingin mencoba berbagai algoritma pengolahan citra.
-   Pengguna yang membutuhkan fitur analisis dan peningkatan kualitas
    gambar.

------------------------------------------------------------------------

# 2. Project Scope

## 2.1 Ruang Lingkup Utama

PIXORA memiliki lima modul utama:

1.  Image Editor Studio.
2.  Photo Restoration.
3.  Creative Lab.
4.  Computer Vision Lab.
5.  Document Scanner.

Selain kelima modul tersebut, sistem menyediakan fitur pendukung seperti
Image Analysis, Processing History, Pipeline Processing, dan Export
Center.

## 2.2 Batasan Sistem

-   Input utama berupa gambar JPG, JPEG, PNG, dan WebP.
-   Pemrosesan dilakukan pada gambar digital berbasis pixel.
-   Format internal gambar menggunakan RGB dengan tipe data `uint8`.
-   Ukuran gambar dibatasi berdasarkan kapasitas memori dan kemampuan
    perangkat.
-   Sistem berfokus pada pemrosesan gambar statis, bukan video secara
    real-time.
-   Deteksi dokumen berfokus pada dokumen yang terlihat dalam satu
    gambar.
-   OCR merupakan fitur tambahan dan bukan komponen wajib versi pertama.
-   Sistem tidak menjamin pemulihan sempurna terhadap gambar yang rusak
    berat.
-   Beberapa algoritma memerlukan parameter yang disesuaikan dengan
    karakteristik gambar.

## 2.3 Prioritas Pengembangan

  -----------------------------------------------------------------------
  Prioritas                           Cakupan
  ----------------------------------- -----------------------------------
  P0 --- Core System                  Upload gambar, preview, image
                                      conversion, processing engine,
                                      parameter controls, dan download

  P1 --- Essential Processing         Enhancement, color transformation,
                                      filtering, edge detection, dan
                                      histogram

  P2 --- Advanced Processing          Restoration, creative effects,
                                      morphology, dan segmentation

  P3 --- Advanced Application         Document Scanner, processing
                                      pipeline, undo/redo, batch
                                      processing, dan export center

  P4 --- Bonus Features               OCR, PDF export, advanced
                                      comparison, processing report, dan
                                      preset library
  -----------------------------------------------------------------------

Prioritas digunakan untuk menentukan urutan pengerjaan apabila waktu
pengembangan terbatas.

------------------------------------------------------------------------

# 3. Feature Specification

## 3.1 Dashboard

Dashboard merupakan halaman utama yang menampilkan ringkasan aplikasi
dan akses ke seluruh modul.

**Fitur:** - Informasi singkat PIXORA. - Navigasi ke setiap modul. -
Ringkasan kategori algoritma. - Recent Processing. - Quick Access. -
Panduan penggunaan singkat.

**Tujuan:** Memudahkan pengguna memahami aplikasi dan mengakses fitur.

## 3.2 Image Editor Studio

Modul ini berfungsi untuk melakukan manipulasi dasar dan peningkatan
kualitas gambar.

### A. Basic Image Processing

    No. Fitur                    Metode / Algoritma
  ----- ------------------------ --------------------------------------------------
      1 Grayscale                RGB to Grayscale Conversion
      2 Negative                 Intensity Negation
      3 Sepia                    Color Transformation Matrix
      4 Brightness               Pixel Intensity Addition
      5 Contrast                 Contrast Adjustment
      6 Gamma Correction         Power-Law Transformation
      7 Global Thresholding      Binary Threshold
      8 Adaptive Thresholding    Adaptive Mean / Gaussian
      9 Histogram Equalization   Histogram Equalization
     10 CLAHE                    Contrast Limited Adaptive Histogram Equalization
     11 RGB Channel Separation   RGB Channel Extraction
     12 HSV Transformation       RGB to HSV Conversion

### B. Image Analysis

    No. Fitur              Metode
  ----- ------------------ ------------------------------------
     13 Histogram Viewer   Histogram Calculation
     14 RGB Histogram      Channel-wise Histogram
     15 Image Metadata     Pillow / OpenCV
     16 Image Statistics   Mean, Standard Deviation, Min, Max

**Output modul:** - Gambar hasil pemrosesan. - Visualisasi histogram. -
Informasi statistik gambar. - Parameter pemrosesan yang digunakan.

## 3.3 Photo Restoration

Modul ini berfungsi meningkatkan kualitas gambar yang mengalami noise,
blur, atau kerusakan tertentu.

    No. Fitur                      Metode / Algoritma
  ----- -------------------------- --------------------------------
      1 Gaussian Blur              Gaussian Smoothing
      2 Median Filter              Median Filtering
      3 Bilateral Filter           Edge-Preserving Smoothing
      4 Image Sharpening           Laplacian Filtering
      5 Unsharp Masking            High-Frequency Enhancement
      6 Salt & Pepper Removal      Median Filtering
      7 Gaussian Noise Reduction   Gaussian / Bilateral Filtering
      8 Motion Deblur              Richardson-Lucy Deconvolution
      9 Scratch Reduction          Morphology + Inpainting

**Parameter yang dapat diatur:** - Kernel Size. - Sigma. - Filter
Strength. - Iteration. - Threshold. - Inpainting Radius.

**Output modul:** - Gambar hasil restorasi. - Perbandingan gambar asli
dan hasil. - Informasi metode yang digunakan.

Motion Deblur dan Scratch Reduction merupakan fitur lanjutan. Kualitas
hasil bergantung pada jenis blur, noise, dan kerusakan gambar.

## 3.4 Creative Lab

Modul ini berisi berbagai efek visual untuk memodifikasi tampilan
gambar.

    No. Fitur            Metode / Algoritma
  ----- ---------------- --------------------------------------------
      1 Pencil Sketch    Grayscale + Inversion + Blur + Dodge Blend
      2 Cartoon Effect   Bilateral Filter + Edge Detection
      3 Emboss           Convolution Kernel
      4 Pixel Art        Downsampling + Upscaling
      5 Halftone         Dot Pattern Simulation
      6 Duotone          Two-Color Mapping
      7 Vignette         Radial Intensity Mask
      8 Motion Blur      Directional Convolution
      9 Glitch Effect    Channel Shift / Pixel Displacement
     10 Posterization    Color Quantization

**Parameter yang dapat diatur:** - Intensity. - Kernel Size. - Color
Palette. - Blur Strength. - Pixel Size. - Effect Amount.

**Output modul:** - Gambar dengan efek kreatif. - Pengaturan intensitas
efek. - Preview hasil sebelum diunduh.

## 3.5 Computer Vision Lab

Modul ini berfokus pada analisis struktur, bentuk, tepi, dan area
tertentu dalam gambar.

### A. Edge Detection

    No. Fitur                  Metode
  ----- ---------------------- ----------------------------
      1 Sobel Operator         First-Order Derivative
      2 Prewitt Operator       First-Order Derivative
      3 Laplacian Operator     Second-Order Derivative
      4 Canny Edge Detection   Multi-stage Edge Detection

### B. Morphological Operations

    No. Fitur      Metode
  ----- ---------- ------------------------
      5 Erosion    Morphological Erosion
      6 Dilation   Morphological Dilation
      7 Opening    Erosion + Dilation
      8 Closing    Dilation + Erosion

### C. Contour & Segmentation

    No. Fitur                    Metode
  ----- ------------------------ ---------------------------
      9 Contour Detection        Contour Extraction
     10 Watershed                Marker-Based Segmentation
     11 GrabCut                  Graph-Based Segmentation
     12 HSV Color Segmentation   Color Thresholding

**Parameter yang dapat diatur:** - Threshold. - Kernel Size. -
Iteration. - Lower HSV. - Upper HSV. - Segmentation Area. - Canny
Threshold.

**Output modul:** - Edge Map. - Mask hasil segmentasi. - Contour
Visualization. - Hasil pemisahan area objek.

## 3.6 Document Scanner

Modul ini dirancang untuk mendeteksi dan memperbaiki tampilan dokumen
yang difoto menggunakan kamera.

    No. Fitur                    Metode / Algoritma
  ----- ------------------------ ----------------------------------
      1 Document Detection       Contour Detection
      2 Perspective Correction   Homography Transformation
      3 Document Binarization    Adaptive Thresholding
      4 Background Removal       Masking / Segmentation
      5 Document Enhancement     Contrast Enhancement + Denoising

**Alur pemrosesan:**

1.  Pengguna mengunggah gambar dokumen.
2.  Sistem melakukan preprocessing.
3.  Sistem mendeteksi kontur dokumen.
4.  Sistem menentukan empat titik sudut dokumen.
5.  Sistem melakukan perspective transformation.
6.  Sistem meningkatkan kualitas dokumen.
7.  Pengguna melihat dan mengunduh hasil.

**Fitur tambahan:** - Mode grayscale. - Mode black and white. - Mode
enhanced color. - Pengaturan threshold. - Download hasil scan.

OCR dapat ditambahkan sebagai pengembangan lanjutan apabila waktu dan
kebutuhan memungkinkan.

## 3.7 Processing Pipeline

Processing Pipeline memungkinkan pengguna menjalankan beberapa algoritma
secara berurutan.

**Contoh:**

`Original Image → Grayscale → Gaussian Blur → Canny Edge Detection → Export`

**Fitur:** - Menambahkan tahapan pemrosesan. - Menghapus tahapan. -
Mengubah urutan proses. - Menjalankan seluruh pipeline. - Melihat hasil
setiap tahap. - Menyimpan konfigurasi pipeline.

Pipeline menggunakan registry algoritma agar tahapan dapat dipanggil
berdasarkan nama operasi dan parameter. Hindari menyimpan objek fungsi
sembarangan dalam session state.

## 3.8 Processing History

Fitur ini digunakan untuk mengelola perubahan gambar selama sesi
penggunaan.

**Fitur:** - Undo. - Redo. - Riwayat operasi. - Informasi parameter. -
Kembali ke gambar asli. - Preview hasil setiap tahapan.

## 3.9 Export Center

Fitur ini digunakan untuk menyimpan hasil pemrosesan.

**Fitur:** - Download PNG. - Download JPG/JPEG. - Download WebP. -
Pengaturan kualitas JPEG. - Informasi ukuran file. - Export hasil
akhir. - Export processing report.

PDF report dapat menjadi fitur tambahan.

------------------------------------------------------------------------

# 4. System Architecture

## 4.1 Arsitektur Sistem

PIXORA menggunakan pendekatan modular layered architecture.

### 1. Presentation Layer

-   Streamlit Pages.
-   Sidebar Navigation.
-   Image Viewer.
-   Parameter Controls.
-   Histogram Viewer.
-   Comparison Viewer.

### 2. Application Layer

-   Processing Pipeline.
-   Session Manager.
-   History Manager.
-   Image Manager.
-   Export Manager.

### 3. Processing Layer

-   Enhancement Algorithms.
-   Filtering Algorithms.
-   Restoration Algorithms.
-   Creative Algorithms.
-   Computer Vision Algorithms.
-   Document Processing Algorithms.

### 4. Data Layer

-   Uploaded Images.
-   Original Image.
-   Processed Image.
-   Processing History.
-   Metadata.
-   Exported Images.

## 4.2 Alur Kerja Sistem

1.  Pengguna membuka aplikasi.
2.  Pengguna mengunggah gambar.
3.  Sistem memvalidasi format dan ukuran gambar.
4.  Sistem mengubah gambar menjadi format internal RGB `uint8`.
5.  Gambar asli disimpan.
6.  Pengguna memilih modul pemrosesan.
7.  Sistem menampilkan parameter sesuai algoritma.
8.  Algoritma memproses gambar.
9.  Hasil ditampilkan pada antarmuka.
10. Sistem memperbarui riwayat pemrosesan.
11. Pengguna dapat membandingkan hasil, melanjutkan proses, atau
    mengunduh gambar.

## 4.3 Standar Format Gambar

Seluruh modul harus mengikuti standar berikut:

-   Format internal: `numpy.ndarray`.
-   Warna: RGB.
-   Data type: `uint8`.
-   Dimensi gambar berwarna: `(height, width, 3)`.
-   Dimensi gambar grayscale: `(height, width)`.
-   Fungsi algoritma tidak boleh mengubah gambar input secara langsung.
-   Hasil algoritma harus berupa array gambar yang valid.

OpenCV umumnya menggunakan format BGR pada beberapa fungsi. Konversi RGB
dan BGR harus dilakukan secara eksplisit pada batas penggunaan fungsi
OpenCV yang membutuhkannya.

## 4.4 Kontrak Fungsi Algoritma

Seluruh algoritma wajib menggunakan pola fungsi yang konsisten.

``` python
def process_image(image, **params):
    """
    Parameters
    ----------
    image : numpy.ndarray
        Input image in RGB format.

    params : dict
        Parameters required by the algorithm.

    Returns
    -------
    numpy.ndarray
        Processed image.
    """
    return processed_image
```

Contoh implementasi Gaussian Blur:

``` python
import cv2

def gaussian_blur(image, kernel_size=5, sigma=0):
    if kernel_size <= 0 or kernel_size % 2 == 0:
        raise ValueError("Kernel size harus bilangan ganjil positif.")

    image_copy = image.copy()

    result = cv2.GaussianBlur(
        image_copy,
        (kernel_size, kernel_size),
        sigma
    )

    return result
```

Setiap algoritma wajib: - Memiliki nama fungsi yang jelas. - Memiliki
parameter default. - Memiliki validasi parameter. - Mengembalikan gambar
dalam format yang sesuai. - Tidak memodifikasi gambar asli. - Memiliki
dokumentasi singkat. - Memiliki pengujian minimal.

------------------------------------------------------------------------

# 5. Technology Stack

  Teknologi      Fungsi
  -------------- -----------------------------------------
  Python 3.11+   Bahasa pemrograman utama
  Streamlit      Framework antarmuka aplikasi
  OpenCV         Pemrosesan dan analisis citra
  NumPy          Operasi array dan pixel
  Pillow         Membaca dan menyimpan gambar
  Matplotlib     Visualisasi histogram dan grafik
  SciPy          Operasi numerik dan pemrosesan lanjutan
  scikit-image   Algoritma pengolahan citra tambahan
  pytest         Unit testing
  Git & GitHub   Version control dan kolaborasi

**Library opsional:** - `streamlit-image-comparison`: perbandingan
gambar interaktif. - `pytesseract`: OCR dengan dependensi Tesseract
OCR. - `reportlab`: pembuatan laporan PDF.

Library opsional hanya digunakan jika benar-benar dibutuhkan.

------------------------------------------------------------------------

# 6. Project Folder Structure

``` text
PIXORA/
│
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── assets/
│   ├── icons/
│   ├── samples/
│   └── styles/
│       └── custom.css
│
├── pages/
│   ├── 1_Image_Editor.py
│   ├── 2_Photo_Restoration.py
│   ├── 3_Creative_Lab.py
│   ├── 4_Computer_Vision.py
│   ├── 5_Document_Scanner.py
│   ├── 6_Image_Analysis.py
│   └── 7_Export_Center.py
│
├── src/
│   ├── core/
│   │   ├── image_manager.py
│   │   ├── image_converter.py
│   │   ├── processing_pipeline.py
│   │   ├── history_manager.py
│   │   ├── session_manager.py
│   │   ├── metadata.py
│   │   └── export_manager.py
│   │
│   ├── algorithms/
│   │   ├── enhancement/
│   │   │   ├── intensity.py
│   │   │   ├── histogram.py
│   │   │   └── color_space.py
│   │   ├── filtering/
│   │   │   ├── smoothing.py
│   │   │   ├── sharpening.py
│   │   │   └── convolution.py
│   │   ├── restoration/
│   │   │   ├── denoising.py
│   │   │   ├── deblurring.py
│   │   │   └── inpainting.py
│   │   ├── creative/
│   │   │   ├── sketch.py
│   │   │   ├── cartoon.py
│   │   │   ├── pixelate.py
│   │   │   └── artistic.py
│   │   ├── vision/
│   │   │   ├── edge_detection.py
│   │   │   ├── morphology.py
│   │   │   ├── segmentation.py
│   │   │   └── contour.py
│   │   └── document/
│   │       ├── detection.py
│   │       ├── perspective.py
│   │       └── enhancement.py
│   │
│   ├── components/
│   │   ├── image_viewer.py
│   │   ├── comparison.py
│   │   ├── histogram_viewer.py
│   │   ├── parameter_controls.py
│   │   └── preset_gallery.py
│   │
│   └── utils/
│       ├── validators.py
│       ├── constants.py
│       └── helpers.py
│
├── tests/
│   ├── test_enhancement.py
│   ├── test_filtering.py
│   ├── test_restoration.py
│   ├── test_creative.py
│   ├── test_vision.py
│   ├── test_document.py
│   └── test_pipeline.py
│
├── samples/
│   ├── original/
│   ├── noisy/
│   └── expected/
│
└── docs/
    ├── MASTER_PLAN.md
    ├── REQUIREMENTS.md
    ├── SYSTEM_ARCHITECTURE.md
    ├── FEATURE_SPECIFICATION.md
    ├── ALGORITHM_DOCUMENTATION.md
    ├── TEAM_RESPONSIBILITIES.md
    ├── TIMELINE.md
    ├── INTEGRATION_GUIDELINES.md
    └── TESTING_PLAN.md
```

Setiap direktori package Python sebaiknya memiliki file `__init__.py`
agar proses import konsisten.

------------------------------------------------------------------------

# 7. Team Responsibilities

Proyek dikerjakan oleh tiga anggota dengan pembagian berdasarkan
tanggung jawab teknis.

## 7.1 Anggota 1 --- UI/UX & System Integration

**Tanggung jawab utama:** Mengembangkan antarmuka, mengelola alur
aplikasi, dan mengintegrasikan seluruh algoritma.

**Modul:** - Dashboard. - Image Editor Interface. - Navigation. - Image
Viewer. - Before-After Comparison. - Parameter Controls. - Histogram
Viewer. - Session Management. - Processing History. - Undo/Redo. -
Processing Pipeline. - Export Center. - Final Integration.

**Direktori utama:** - `app.py` - `pages/` - `src/components/` -
`src/core/`

**Output pekerjaan:** - Antarmuka aplikasi. - Sistem upload dan
preview. - Sistem pemanggilan algoritma. - Integrasi semua modul. -
Sistem penyimpanan hasil.

## 7.2 Anggota 2 --- Image Processing & Restoration

**Tanggung jawab utama:** Mengembangkan algoritma peningkatan kualitas,
filtering, restorasi, dan efek kreatif.

**Modul:** - Image Enhancement. - Color Transformation. - Histogram
Processing. - Image Filtering. - Image Restoration. - Creative Effects.

**Direktori utama:** - `src/algorithms/enhancement/` -
`src/algorithms/filtering/` - `src/algorithms/restoration/` -
`src/algorithms/creative/`

**Output pekerjaan:** - Seluruh algoritma sesuai spesifikasi. -
Parameter algoritma. - Dokumentasi metode. - Pengujian hasil algoritma.

## 7.3 Anggota 3 --- Computer Vision & Document Processing

**Tanggung jawab utama:** Mengembangkan algoritma analisis citra,
deteksi tepi, segmentasi, dan pemrosesan dokumen.

**Modul:** - Edge Detection. - Morphological Operations. - Contour
Detection. - Image Segmentation. - Document Detection. - Perspective
Transformation. - Document Enhancement.

**Direktori utama:** - `src/algorithms/vision/` -
`src/algorithms/document/`

**Output pekerjaan:** - Algoritma Computer Vision. - Modul Document
Scanner. - Parameter deteksi dan segmentasi. - Dokumentasi dan
pengujian.

## 7.4 Aturan Kolaborasi

-   Seluruh anggota harus mengikuti struktur folder.
-   Seluruh algoritma harus mengikuti kontrak fungsi.
-   Anggota 1 bertanggung jawab atas integrasi, tetapi bukan
    satu-satunya pihak yang menguji aplikasi.
-   Anggota 2 dan 3 wajib menyediakan algoritma yang dapat dijalankan
    secara mandiri.
-   Setiap anggota wajib melakukan pengujian pada modul masing-masing.
-   Semua anggota wajib melakukan review dan pengujian integrasi.
-   Perubahan pada kontrak fungsi harus disepakati bersama.

Pembagian ini menunjukkan tanggung jawab utama, bukan pembatasan
kontribusi. Semua anggota tetap berkontribusi dalam debugging, testing,
dokumentasi, dan finalisasi.

------------------------------------------------------------------------

# 8. Development Workflow

## 8.1 Git Workflow

Repository menggunakan branch utama berikut:

``` text
main
│
└── develop
    │
    ├── feature/ui
    ├── feature/processing
    └── feature/vision
```

**Aturan:** - `main`: versi stabil yang siap didemonstrasikan. -
`develop`: integrasi hasil pengembangan. - `feature/ui`: pengembangan UI
dan core system. - `feature/processing`: algoritma Image Processing. -
`feature/vision`: algoritma Computer Vision dan Document Scanner.

Setiap anggota mengembangkan fitur melalui branch masing-masing,
kemudian membuat Pull Request ke `develop`.

Setelah seluruh fitur diuji, hasil yang stabil digabungkan ke `main`.

## 8.2 Commit Convention

Gunakan format:

``` text
type: short description
```

  Prefix     Penggunaan
  ---------- -------------------------------------
  feat       Menambahkan fitur
  fix        Memperbaiki bug
  refactor   Memperbaiki struktur kode
  test       Menambahkan pengujian
  docs       Memperbarui dokumentasi
  style      Perubahan format atau tampilan kode

Contoh:

``` text
feat: add grayscale processing
feat: implement document detection
fix: correct RGB image conversion
refactor: improve processing pipeline
test: add gaussian blur test
docs: update algorithm documentation
```

------------------------------------------------------------------------

# 9. Implementation Timeline

Target awal pengembangan adalah delapan minggu. Timeline dapat
disesuaikan dengan jadwal perkuliahan dan tenggat tugas.

## Week 1 --- Planning & Foundation

**Target:** - Menyelesaikan master plan. - Menentukan struktur
repository. - Membuat GitHub repository. - Menyiapkan virtual
environment. - Menginstal seluruh dependency. - Membuat dashboard
awal. - Membuat sistem upload gambar. - Menyepakati kontrak fungsi
algoritma.

**Deliverable:** Aplikasi awal dapat dijalankan dan menerima gambar.

## Week 2 --- Core System & Basic Processing

**Target:** - Image Manager. - Image Converter. - Session Manager. -
Preview gambar. - Grayscale. - Negative. - Sepia. - Brightness. -
Contrast. - Gamma Correction. - Thresholding.

**Deliverable:** Pengguna dapat mengunggah dan memproses gambar
menggunakan fitur dasar.

## Week 3 --- Enhancement & Filtering

**Target:** - Histogram Equalization. - CLAHE. - RGB Channel. - HSV
Transformation. - Gaussian Blur. - Median Filter. - Bilateral Filter. -
Image Sharpening. - Unsharp Masking.

**Deliverable:** Modul enhancement dan filtering berfungsi.

## Week 4 --- Restoration & Creative Lab

**Target:** - Gaussian Noise Reduction. - Salt & Pepper Removal. -
Motion Deblur. - Scratch Reduction. - Pencil Sketch. - Cartoon Effect. -
Emboss. - Pixel Art. - Halftone. - Duotone. - Vignette. - Motion Blur. -
Glitch. - Posterization.

**Deliverable:** Modul restoration dan creative effects terintegrasi.

## Week 5 --- Computer Vision

**Target:** - Sobel. - Prewitt. - Laplacian. - Canny. - Erosion. -
Dilation. - Opening. - Closing. - Contour Detection. - Watershed. -
GrabCut. - HSV Segmentation.

**Deliverable:** Modul Computer Vision dapat menjalankan metode deteksi
dan segmentasi.

## Week 6 --- Document Scanner & Integration

**Target:** - Document Detection. - Perspective Correction. - Document
Binarization. - Background Removal. - Document Enhancement. - Processing
Pipeline. - Processing History. - Undo/Redo.

**Deliverable:** Seluruh modul utama sudah terintegrasi.

## Week 7 --- Testing & Optimization

**Target:** - Unit Testing. - Integration Testing. - Perbaikan bug. -
Optimasi performa. - Pengujian berbagai format gambar. - Pengujian
ukuran gambar. - Evaluasi hasil algoritma.

**Deliverable:** Aplikasi stabil dan seluruh fitur prioritas utama dapat
digunakan.

## Week 8 --- Finalization

**Target:** - Final UI/UX. - Dokumentasi. - README. - Laporan proyek. -
Persiapan presentasi. - Pembuatan dataset contoh. - Demo aplikasi. -
Final review.

**Deliverable:** PIXORA siap dipresentasikan dan didemonstrasikan.

------------------------------------------------------------------------

# 10. Testing & Evaluation Plan

Pengujian dilakukan untuk memastikan setiap algoritma berjalan sesuai
tujuan dan aplikasi dapat digunakan secara stabil.

## 10.1 Functional Testing

Memastikan seluruh fitur berjalan sesuai spesifikasi.

Contoh: - Upload gambar berhasil. - Grayscale menghasilkan gambar
grayscale. - Brightness mengubah intensitas gambar. - Canny menghasilkan
edge map. - Document Scanner mendeteksi dokumen. - Export menghasilkan
file yang dapat dibuka.

## 10.2 Algorithm Validation

Memeriksa kebenaran implementasi algoritma.

Contoh pengujian: - Membandingkan output grayscale dengan perhitungan
konversi warna. - Memastikan Gaussian Blur mengurangi variasi intensitas
lokal pada kondisi yang sesuai. - Memeriksa hasil thresholding. -
Memastikan operasi morphology menghasilkan perubahan sesuai definisi. -
Memeriksa koordinat perspective transformation.

## 10.3 Performance Testing

Mengukur: - Processing Time. - Memory Usage. - Image Resolution. - Waktu
pemuatan gambar. - Waktu pemrosesan setiap algoritma.

## 10.4 Visual Evaluation

Mengamati hasil pemrosesan secara visual menggunakan gambar uji yang
sama.

Perbandingan dilakukan antara: - Original Image. - Processed Image. -
Expected Output jika tersedia.

## 10.5 Evaluation Metrics

  Metrik           Kegunaan
  ---------------- --------------------------------------------
  MSE              Mengukur rata-rata kesalahan kuadrat pixel
  PSNR             Mengukur kualitas rekonstruksi citra
  SSIM             Mengukur kemiripan struktural
  Execution Time   Mengukur waktu pemrosesan
  Histogram        Menganalisis distribusi intensitas

MSE, PSNR, dan SSIM terutama digunakan untuk eksperimen restorasi atau
peningkatan kualitas yang memiliki gambar referensi. Ketiganya tidak
tepat dijadikan satu-satunya ukuran keberhasilan efek kreatif atau edge
detection.

## 10.6 Dataset Pengujian

Gunakan beberapa kategori gambar: 1. Gambar normal. 2. Gambar dengan
Gaussian Noise. 3. Gambar dengan Salt & Pepper Noise. 4. Gambar blur. 5.
Gambar dengan kontras rendah. 6. Gambar dokumen. 7. Gambar dengan objek
dan latar belakang berbeda. 8. Gambar dengan variasi warna.

Seluruh pengujian harus menggunakan gambar yang sama untuk perbandingan
metode yang relevan.

------------------------------------------------------------------------

# 11. UI/UX Design Guidelines

## 11.1 Konsep Visual

PIXORA menggunakan konsep antarmuka modern, minimalis, dan profesional.

**Arah desain:** - Dark Mode sebagai tampilan utama. - Warna dasar
charcoal atau dark navy. - Aksen biru. - Teks putih dan abu-abu. -
Layout modular. - Navigasi sidebar. - Preview gambar sebagai fokus
utama.

## 11.2 Struktur Halaman

**Dashboard** - Project Overview. - Quick Access. - Recent Processing.

**Image Editor** - Image Upload. - Basic Processing. - Enhancement. -
Color Transformation.

**Photo Restoration** - Denoising. - Deblurring. - Sharpening. -
Inpainting.

**Creative Lab** - Artistic Filters. - Stylization. - Visual Effects.

**Computer Vision** - Edge Detection. - Morphology. - Contour. -
Segmentation.

**Document Scanner** - Document Detection. - Perspective Correction. -
Enhancement. - Export.

**Image Analysis** - Histogram. - RGB Distribution. - Image
Statistics. - Metadata.

**Export Center** - File Format. - Image Quality. - Download.

## 11.3 UI Interaction

Setiap fitur idealnya memiliki: - Nama algoritma. - Deskripsi singkat. -
Input parameter. - Tombol Apply. - Preview hasil. - Tombol Reset. -
Informasi hasil pemrosesan.

Parameter harus muncul sesuai fitur yang dipilih, bukan menampilkan
seluruh parameter dari semua algoritma sekaligus.

------------------------------------------------------------------------

# 12. Quality Assurance & Acceptance Criteria

Proyek dinyatakan memenuhi target utama apabila:

1.  Aplikasi dapat dijalankan tanpa error fatal.
2.  Pengguna dapat mengunggah gambar sesuai format yang didukung.
3.  Seluruh modul utama dapat diakses.
4.  Algoritma wajib dapat dijalankan dan menghasilkan output valid.
5.  Format gambar konsisten di antara modul.
6.  Pengguna dapat melihat hasil pemrosesan.
7.  Pengguna dapat mengunduh hasil.
8.  Sistem menangani parameter yang tidak valid.
9.  Gambar asli tetap tersedia untuk perbandingan.
10. Riwayat pemrosesan tidak menyebabkan gambar asli tertimpa.
11. Pipeline dapat menjalankan operasi berurutan.
12. Dokumentasi penggunaan tersedia.
13. Pengujian dasar dan integrasi telah dilakukan.

## 12.1 Definition of Done

Setiap fitur dianggap selesai apabila: - Kode sudah selesai. - Tidak ada
error pada skenario penggunaan normal. - Parameter sudah divalidasi. -
Output sudah diperiksa. - Minimal satu unit test tersedia untuk
algoritma yang relevan. - Dokumentasi singkat sudah dibuat. - Perubahan
sudah di-commit. - Integrasi ke aplikasi sudah berhasil.

------------------------------------------------------------------------

# 13. Risk Management

  -----------------------------------------------------------------------
  Risiko                  Dampak                  Mitigasi
  ----------------------- ----------------------- -----------------------
  Integrasi modul gagal   Fitur tidak dapat       Sepakati kontrak fungsi
                          digunakan bersama       sejak awal

  Perbedaan format gambar Warna atau output tidak Gunakan standar RGB
                          sesuai                  `uint8`

  Algoritma terlalu       Target waktu tidak      Prioritaskan P0--P2
  kompleks                tercapai                

  Performa lambat         Aplikasi sulit          Optimasi resolusi dan
                          digunakan               proses

  Streamlit melakukan     State aplikasi tidak    Gunakan
  rerun                   konsisten               `st.session_state`

  Konflik Git             Perubahan kode tertimpa Gunakan branch dan Pull
                                                  Request

  Hasil algoritma kurang  Kualitas demonstrasi    Siapkan dataset dan
  baik                    menurun                 parameter uji

  Fitur terlalu banyak    Pengujian tidak         Tentukan fitur wajib
                          maksimal                dan bonus
  -----------------------------------------------------------------------

## 13.1 Strategi Penanganan Fitur Sulit

**Motion Deblur:** Implementasikan setelah fitur denoising stabil. Uji
pada gambar dengan motion blur yang terkontrol.

**Scratch Reduction:** Batasi terlebih dahulu pada goresan atau
kerusakan yang dapat dideteksi melalui mask. Inpainting tidak selalu
dapat mengembalikan informasi asli.

**Watershed:** Gunakan preprocessing dan marker generation yang sesuai
agar segmentasi tidak menghasilkan terlalu banyak region.

**GrabCut:** Sediakan mekanisme pemilihan area awal oleh pengguna agar
proses segmentasi lebih terarah.

**Document Detection:** Sediakan fallback jika sistem gagal menemukan
empat sudut dokumen secara otomatis.

------------------------------------------------------------------------

# 14. Project Deliverables

Hasil akhir proyek yang harus disiapkan:

    No. Deliverable               Keterangan
  ----- ------------------------- ----------------------------------
      1 Source Code               Seluruh kode aplikasi
      2 GitHub Repository         Repository proyek
      3 README.md                 Panduan instalasi dan penggunaan
      4 Master Plan               Dokumen perencanaan proyek
      5 System Architecture       Dokumentasi arsitektur
      6 Algorithm Documentation   Penjelasan algoritma
      7 Testing Documentation     Hasil pengujian
      8 User Guide                Panduan pengguna
      9 Demo Application          Aplikasi yang dapat dijalankan
     10 Final Report              Laporan akhir proyek
     11 Presentation              Materi presentasi
     12 Sample Dataset            Gambar untuk demonstrasi

------------------------------------------------------------------------

# 15. Success Indicators

Keberhasilan PIXORA tidak hanya diukur dari banyaknya fitur, tetapi juga
dari kualitas implementasinya.

Indikator keberhasilan: - Seluruh modul utama terintegrasi. - Algoritma
memiliki implementasi yang dapat dijelaskan. - Hasil pemrosesan dapat
diamati secara visual. - Aplikasi memiliki alur penggunaan yang jelas. -
Pengguna dapat mengatur parameter. - Pengujian menunjukkan algoritma
bekerja sesuai tujuan. - Dokumentasi dan source code tersusun rapi. -
Setiap anggota memahami kontribusi dan keseluruhan sistem.

Target akhir adalah menghasilkan aplikasi yang tidak hanya berisi
kumpulan tombol efek gambar, tetapi benar-benar menjadi platform
demonstrasi berbagai metode Image Processing dan Computer Vision.

------------------------------------------------------------------------

# 16. Final Project Statement

PIXORA --- Advanced Image Processing & Computer Vision Studio merupakan
proyek pengembangan aplikasi pengolahan citra digital yang
mengintegrasikan berbagai metode pemrosesan gambar dalam satu platform
berbasis Python dan Streamlit.

Melalui lima modul utama, yaitu Image Editor Studio, Photo Restoration,
Creative Lab, Computer Vision Lab, dan Document Scanner, aplikasi ini
dirancang untuk menunjukkan implementasi berbagai konsep pengolahan
citra, mulai dari manipulasi intensitas pixel hingga teknik analisis dan
transformasi citra yang lebih kompleks.

Dengan pendekatan modular, pembagian tanggung jawab yang terstruktur,
dan standar integrasi yang konsisten, PIXORA diharapkan dapat menjadi
aplikasi yang fungsional, mudah dikembangkan, dan memiliki nilai
akademis yang kuat.

**PIXORA --- Transforming Images Through Intelligent Processing.**
