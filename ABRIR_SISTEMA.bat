@echo off
chcp 65001 > nul
title Abrir Sistema de Gestión del Contrato
echo Iniciando Sistema de Gestión del Contrato 2026...
cd /d "%~dp0"
if exist "GESTION MAQUINARIA 2026.html" (
    start "" "GESTION MAQUINARIA 2026.html"
) else (
    start "" "index.html"
)
exit
