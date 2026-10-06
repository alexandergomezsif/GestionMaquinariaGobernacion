@echo off
chcp 65001 > nul
title Publicar version 1.2.1 en GitHub
cd /d "%~dp0"
set LOG=Backup\publicar_v1.2.1.log
if not exist Backup mkdir Backup
echo ==== Publicacion v1.2.1 %date% %time% ==== > "%LOG%"
echo Publicando la version 1.2.1 en GitHub. Esta ventana se cierra sola al terminar.
git add -A index.html "GESTION MAQUINARIA 2026.html" index_bundle.html bundle.py .gitignore SUBIR_A_GITHUB.bat ABRIR_SISTEMA.bat README.md CHANGELOG.md PUBLICAR_V1.2.1.bat >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1
git commit -F mensaje_commit_v1.2.1.txt >> "%LOG%" 2>&1
echo COMMIT_EXIT=%ERRORLEVEL% >> "%LOG%"
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set RAMA=%%B
git push origin %RAMA% >> "%LOG%" 2>&1
echo PUSH_EXIT=%ERRORLEVEL% >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
echo ==== FIN ==== >> "%LOG%"
del mensaje_commit_v1.2.1.txt > nul 2>&1
timeout /t 3 > nul
exit
