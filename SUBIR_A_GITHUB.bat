@echo off
chcp 65001 > nul
title Subir Cambios a GitHub - Sistema de Gestión del Contrato
color 0A
setlocal

echo ========================================================
echo       SUBIENDO ACTUALIZACIONES A GITHUB
echo   Repositorio: GestionMaquinariaGobernacion
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/5] Generando bundle local (no se sube a GitHub)...
python bundle.py
if errorlevel 1 echo [AVISO] No se pudo generar el bundle. Verifique que Python este instalado.
echo.

echo [2/5] Retirando del control de versiones archivos que no deben subirse...
git rm --cached --ignore-unmatch -q "img/firmaalexgomez.png" "img/firmaalexgomez.png.png" > nul
echo.

echo [3/5] Archivos que se van a subir:
git add -A js css img index.html "GESTION MAQUINARIA 2026.html" index_bundle.html bundle.py export_code.py ABRIR_SISTEMA.bat SUBIR_A_GITHUB.bat LIMPIEZA_V1.2.bat .gitignore README.md CHANGELOG.md tests tools 2> nul
git status --short
echo.
set /p CONTINUAR="Revise la lista. Desea continuar? (S/N): "
if /i not "%CONTINUAR%"=="S" (
    echo Operacion cancelada. No se subio nada.
    pause
    exit /b 0
)

set COMMIT_MSG=
set /p COMMIT_MSG="[4/5] Describa el cambio (obligatorio): "
if "%COMMIT_MSG%"=="" (
    echo [ERROR] El mensaje es obligatorio. Operacion cancelada.
    pause
    exit /b 1
)
git commit -m "%COMMIT_MSG%"
echo.

for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set RAMA=%%B
echo [5/5] Enviando cambios a GitHub (rama %RAMA%)...
git push origin %RAMA%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   EXITO: cambios subidos a la rama %RAMA% de
    echo   https://github.com/alexandergomezsif/GestionMaquinariaGobernacion
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [ERROR] No se pudo completar la subida.
    echo   Verifique su conexion a internet o sus credenciales de GitHub.
    echo ========================================================
)
echo.
pause
