# Checklist uji manual (Windows)

Dijalankan pada `dist\Pixora\Pixora.exe` hasil build, idealnya di komputer yang **tidak** punya Python.
Centang tiap baris; catat yang gagal beserta pesan errornya.

## Start & gambar
- [ ] Aplikasi terbuka tanpa error; tema gelap tampil; jendela bisa diperbesar/diperkecil tanpa kontrol bertumpuk
- [ ] Open Image (Ctrl+O) untuk JPG, PNG, BMP, TIFF, WEBP; info gambar tampil di bawah panel kiri
- [ ] Drag & drop gambar ke panel kiri
- [ ] Buka file `.txt` / file rusak → muncul pesan error yang jelas (aplikasi tidak crash)
- [ ] Buka gambar dari folder dengan spasi atau huruf non-ASCII (mis. `Foto Kuliah é`)

## Apply
- [ ] Memilih metode dan menggeser parameter TIDAK mengubah panel kanan; muncul "Pending changes"
- [ ] Apply menjalankan metode; panel kanan berubah; status Completed
- [ ] Ubah parameter setelah Apply → hasil lama tetap sampai Apply ditekan lagi
- [ ] Reset (parameter) tidak memproses; Reset Result mengosongkan panel kanan, gambar asli tetap
- [ ] Gambar besar (≥ 12 MP): jendela tetap responsif saat Apply (tidak "Not Responding")
- [ ] Semua 13 metode bisa di-Apply tanpa error

## Perbandingan & riwayat
- [ ] Zoom roda mouse, drag untuk pan; Synchronized Zoom & Pan bekerja di kedua panel
- [ ] Peek Original, Reset Comparison View, Fit, 1:1
- [ ] Undo / Redo (Ctrl+Z / Ctrl+Y), dobel-klik item History untuk lompat
- [ ] Dock Pipeline: matikan satu langkah, ubah urutan (drag), Run Pipeline, Save/Load JSON
- [ ] Histogram (Gray & RGB) tampil di dock Analysis, sumber Original dan Processed

## Simpan & Export
- [ ] Save As (PNG, JPG, BMP, TIFF, WEBP) → file bisa dibuka di aplikasi lain
- [ ] Export dengan kualitas dan skala 50% → ukuran gambar sesuai
- [ ] Menyimpan ke nama file yang sudah ada → ada konfirmasi timpa
- [ ] Menyimpan ke file gambar asli → ada peringatan

## Batch
- [ ] Pilih beberapa gambar + 1 file rusak → rusak dilaporkan gagal, sisanya tetap diproses
- [ ] Import Folder; hasil tersimpan di folder output dengan akhiran `_processed`; menjalankan ulang tidak menimpa (`_1`)
- [ ] Tombol Batalkan menghentikan batch

## Kamera
- [ ] Combo kamera menampilkan "Camera 0" (atau lebih) dan tidak ada jendela konsol penuh warning
- [ ] Open Camera → live preview & histogram live di dock Analysis; panel kanan tetap kosong sampai Apply ditekan
- [ ] Apply saat kamera aktif → Live Processing; ubah parameter TIDAK berpengaruh sampai Apply lagi
- [ ] Stop Processing menghentikan pemrosesan tanpa menutup kamera
- [ ] Capture → gambar jadi sumber statis, bisa diproses dan disimpan
- [ ] Tutup aplikasi saat kamera aktif → lampu kamera padam (kamera dilepas)
- [ ] Tanpa kamera terpasang: Open Camera menampilkan pesan, tidak crash

## Penutup
- [ ] Toggle tema gelap/terang
- [ ] Menu Help: User Guide, Algorithm Documentation, About
