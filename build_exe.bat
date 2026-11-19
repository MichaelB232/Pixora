@echo off
setlocal
REM Build Pixora menjadi aplikasi Windows: dist\Pixora\Pixora.exe
REM
REM Pemakaian:
REM   build_exe.bat          aplikasi tanpa jendela konsol (untuk dibagikan)
REM   build_exe.bat debug    dengan jendela konsol (untuk melihat pesan error jika aplikasi gagal start)
REM
REM Build selalu memakai virtualenv bersih (.venv-build) yang hanya berisi requirements.txt,
REM supaya paket lain di komputer Anda tidak ikut terbundel (ukuran lebih kecil, hasil konsisten).
cd /d "%~dp0"

set WINDOW=--windowed
if /i "%~1"=="debug" set WINDOW=

if not exist ".venv-build\Scripts\python.exe" (
  echo [1/3] Membuat virtualenv bersih .venv-build ...
  python -m venv .venv-build
  if errorlevel 1 goto :fail
)

echo [2/3] Memasang dependensi dari requirements.txt ...
".venv-build\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :fail

echo [3/3] Membangun dengan PyInstaller ...
".venv-build\Scripts\python.exe" -m PyInstaller --noconfirm %WINDOW% --name Pixora ^
  --hidden-import matplotlib.backends.backend_qtagg ^
  main.py
if errorlevel 1 goto :fail

echo.
echo Selesai. Jalankan: dist\Pixora\Pixora.exe
echo Untuk dibagikan, kompres seluruh folder dist\Pixora (bukan hanya Pixora.exe).
pause
exit /b 0

:fail
echo.
echo BUILD GAGAL. Baca pesan error di atas.
pause
exit /b 1
