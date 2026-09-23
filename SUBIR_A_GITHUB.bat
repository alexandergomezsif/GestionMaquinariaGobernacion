@echo off
chcp 65001 > nul
title Subir Cambios a GitHub - Sistema de Gestión del Contrato
color 0A

echo ========================================================
echo       SUBIENDO ACTUALIZACIONES A GITHUB
echo   Repositorio: GestionMaquinariaGobernacion
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Empaquetando aplicación con bundle.py...
python bundle.py
if exist "GESTION MAQUINARIA 2026.html" (
    copy /y "GESTION MAQUINARIA 2026.html" "index_bundle.html" > nul
    echo       Empaquetado completado con éxito.
) else (
    echo [AVISO] bundle.py no generó el archivo esperado o Python no está en PATH.
)
echo.

echo [2/4] Agregando archivos al control de versiones...
git add -A
echo.

set /p COMMIT_MSG="[3/4] Escribe una descripción del cambio (Enter para mensaje automático): "
if "%COMMIT_MSG%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set COMMIT_MSG=Actualizacion del sistema %date% %time%
)

git commit -m "%COMMIT_MSG%"
echo.

echo [4/4] Enviando cambios a GitHub (rama main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   ¡ÉXITO! Los cambios fueron subidos correctamente a:
    echo   https://github.com/alexandergomezsif/GestionMaquinariaGobernacion
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [ERROR] No se pudo completar la subida.
    echo   Verifica tu conexión a internet o tus credenciales de GitHub.
    echo ========================================================
)

echo.
pause
