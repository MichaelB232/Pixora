@echo off
REM Build Pixora menjadi aplikasi Windows (folder dist\Pixora\Pixora.exe)
python -m pip install -r requirements.txt
python -m PyInstaller --noconfirm --windowed --name Pixora ^
  --hidden-import matplotlib.backends.backend_qtagg ^
  main.py
echo.
echo Selesai. Jalankan: dist\Pixora\Pixora.exe
pause
