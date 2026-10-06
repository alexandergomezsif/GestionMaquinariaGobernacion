@echo off
chcp 65001 > nul
title Publicar version 1.3 en GitHub
cd /d "%~dp0"
set LOG=Backup\publicar_v1.3.log
if not exist Backup mkdir Backup
echo ==== Publicacion v1.3 %date% %time% ==== > "%LOG%"
echo Publicando la version 1.3 en GitHub. Esta ventana se cierra sola al terminar.
git add -A index.html js tools CHANGELOG.md README.md SUBIR_A_GITHUB.bat PUBLICAR_V1.3.bat >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1
git commit -F mensaje_commit_v1.3.txt >> "%LOG%" 2>&1
echo COMMIT_EXIT=%ERRORLEVEL% >> "%LOG%"
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set RAMA=%%B
git push origin %RAMA% >> "%LOG%" 2>&1
echo PUSH_EXIT=%ERRORLEVEL% >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
echo ==== FIN ==== >> "%LOG%"
del mensaje_commit_v1.3.txt > nul 2>&1
timeout /t 3 > nul
exit
