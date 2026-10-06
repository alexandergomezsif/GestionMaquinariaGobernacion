"""Empaqueta la aplicación en un único HTML autocontenido.

Lee index.html de la MISMA carpeta donde está este script, incrusta CSS, JS
locales e imágenes (img/*.png) y escribe "GESTION MAQUINARIA 2026.html".
El archivo generado NO se versiona (ver .gitignore).
"""
import base64
import pathlib
import re
import sys

BASE_DIR = pathlib.Path(__file__).resolve().parent
INDEX = BASE_DIR / 'index.html'
OUT = BASE_DIR / 'GESTION MAQUINARIA 2026.html'


def read_text(rel):
    path = (BASE_DIR / rel).resolve()
    if BASE_DIR not in path.parents or not path.is_file():
        return None
    return path.read_text(encoding='utf-8')


def inline_css(match):
    css = read_text(match.group(1))
    return match.group(0) if css is None else f'<style>\n{css}\n</style>'


def inline_js(match):
    js = read_text(match.group(1))
    if js is None:
        return match.group(0)
    # Evita cerrar prematuramente la etiqueta <script> del bundle
    js = js.replace('</script', '<\\/script')
    return f'<script>\n{js}\n</script>'


def inline_img(match):
    path = BASE_DIR / match.group(0)
    if not path.is_file():
        return match.group(0)
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def main():
    if not INDEX.is_file():
        sys.exit(f'No se encontró {INDEX}')
    html = INDEX.read_text(encoding='utf-8')
    html = re.sub(r'<link rel="stylesheet" href="(?!https?:)(.*?)">', inline_css, html)
    html = re.sub(r'<script src="(?!https?:)(.*?)"></script>', inline_js, html)
    html = re.sub(r'img/[A-Za-z0-9_\-]+\.png', inline_img, html)
    OUT.write_text(html, encoding='utf-8')
    print(f'Bundle generado: {OUT.name} ({OUT.stat().st_size / 1_048_576:.2f} MB) desde {BASE_DIR}')


if __name__ == '__main__':
    main()
