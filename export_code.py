"""Exporta todo el código fuente a un único .txt para revisión.

Usa rutas relativas a la carpeta de este script.
Salida: Backup/CODIGO COMPLETO PARA REVISAR/CODIGO_COMPLETO_SISTEMA_GESTION.txt
"""
import os
import pathlib

BASE_DIR = pathlib.Path(__file__).resolve().parent
DEST_DIR = BASE_DIR / 'Backup' / 'CODIGO COMPLETO PARA REVISAR'
DEST_FILE = DEST_DIR / 'CODIGO_COMPLETO_SISTEMA_GESTION.txt'

VALID_EXTENSIONS = ('.html', '.css', '.js', '.py', '.bat', '.md')
EXCLUDE_DIRS = {'.git', 'Backup', 'img', 'libs', 'Manual web', 'FentesActivos', 'HOJAS DE VIDA SIF 621', '__pycache__'}
EXCLUDE_FILES = {'GESTION MAQUINARIA 2026.html', 'index_bundle.html'}


def main():
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    with DEST_FILE.open('w', encoding='utf-8') as out:
        out.write('=' * 80 + '\nCÓDIGO FUENTE COMPLETO - SISTEMA DE GESTIÓN DEL CONTRATO\n' + '=' * 80 + '\n\n')
        for root, dirs, files in os.walk(BASE_DIR):
            dirs[:] = sorted(d for d in dirs if d not in EXCLUDE_DIRS)
            for name in sorted(files):
                if not name.endswith(VALID_EXTENSIONS) or name in EXCLUDE_FILES:
                    continue
                path = pathlib.Path(root) / name
                out.write('\n' + '=' * 80 + f'\nARCHIVO: {path.relative_to(BASE_DIR)}\n' + '=' * 80 + '\n\n')
                try:
                    out.write(path.read_text(encoding='utf-8') + '\n')
                except (OSError, UnicodeDecodeError) as err:
                    out.write(f'[Error leyendo el archivo: {err}]\n')
    print(f'Código exportado en: {DEST_FILE}')


if __name__ == '__main__':
    main()
