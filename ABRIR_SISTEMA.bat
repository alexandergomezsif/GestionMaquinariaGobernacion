@echo off
chcp 65001 > nul
title Abrir Sistema de Gestión del Contrato
cd /d "%~dp0"
echo Iniciando Sistema de Gestion del Contrato...
rem Se abre siempre la version de codigo fuente (index.html), que nunca queda desactualizada.
rem "GESTION MAQUINARIA 2026.html" e "index_bundle.html" solo redirigen a index.html (enlaces antiguos de GitHub Pages).
start "" "index.html"
exit
