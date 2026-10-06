@echo off
chcp 65001 > nul
title Publicar version 1.2 en GitHub
cd /d "%~dp0"
set LOG=Backup\publicar_v1.2.log
if not exist Backup mkdir Backup
echo ==== Publicacion v1.2 %date% %time% ==== > "%LOG%"
echo Publicando la version 1.2 en GitHub. Esta ventana se cierra sola al terminar.
echo.
echo [1] Retirando del control de versiones archivos generados y la firma >> "%LOG%"
git rm --cached --ignore-unmatch -q "GESTION MAQUINARIA 2026.html" "index_bundle.html" "img/firmaalexgomez.png" "img/firmaalexgomez.png.png" >> "%LOG%" 2>&1
echo [2] Agregando cambios >> "%LOG%"
git add -A js css img index.html bundle.py export_code.py ABRIR_SISTEMA.bat SUBIR_A_GITHUB.bat LIMPIEZA_V1.2.bat PUBLICAR_V1.2.bat .gitignore README.md CHANGELOG.md tests >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1
echo [3] Commit >> "%LOG%"
git commit -F mensaje_commit_v1.2.txt >> "%LOG%" 2>&1
echo COMMIT_EXIT=%ERRORLEVEL% >> "%LOG%"
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set RAMA=%%B
echo [4] Push a %RAMA% >> "%LOG%"
git push origin %RAMA% >> "%LOG%" 2>&1
echo PUSH_EXIT=%ERRORLEVEL% >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1
echo ==== FIN ==== >> "%LOG%"
del mensaje_commit_v1.2.txt > nul 2>&1
echo Listo. Resultado en %LOG%
timeout /t 5 > nul
exit
