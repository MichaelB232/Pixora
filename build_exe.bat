@echo off
REM Build Pixel Lab menjadi aplikasi Windows (folder dist\PixelLab\PixelLab.exe)
python -m pip install -r requirements.txt
python -m PyInstaller --noconfirm --windowed --name PixelLab ^
  --hidden-import matplotlib.backends.backend_qtagg ^
  main.py
echo.
echo Selesai. Jalankan: dist\PixelLab\PixelLab.exe
pause
