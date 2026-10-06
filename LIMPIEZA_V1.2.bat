@echo off
chcp 65001 > nul
title Limpieza de archivos retirados - v1.2
cd /d "%~dp0"
echo Este script mueve (no borra) los archivos que la version 1.2 ya no usa
echo a la carpeta Backup\archivos_retirados_v1.2. Puede ejecutarse una sola vez.
echo.
set DEST=Backup\archivos_retirados_v1.2
if not exist "%DEST%" mkdir "%DEST%"
for %%F in ("js\modules\frentes.js" "js\utils\search.js" "js\datos_app.json" "js\libs\html2pdf.bundle.min.js" "index_bundle.html" "img\firmaalexgomez.png.png") do (
    if exist %%F (
        move /Y %%F "%DEST%\" > nul
        echo   Movido: %%~F
    )
)
echo.
echo Listo. Si todo funciona bien, puede borrar la carpeta %DEST% mas adelante.
echo Luego ejecute SUBIR_A_GITHUB.bat para registrar el retiro en el repositorio.
pause
