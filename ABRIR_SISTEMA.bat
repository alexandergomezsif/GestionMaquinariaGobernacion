@echo off
chcp 65001 > nul
title Abrir Sistema de Gestión del Contrato
cd /d "%~dp0"
echo Iniciando Sistema de Gestion del Contrato...
rem Se abre siempre la version de codigo fuente (index.html), que nunca queda desactualizada.
rem El archivo "GESTION MAQUINARIA 2026.html" es solo una copia portable generada con bundle.py.
start "" "index.html"
exit
