import os, re

base_dir = r'C:\Users\SuperUsuario\.gemini\antigravity\scratch\sistema_gestion_contrato'
index_path = os.path.join(base_dir, 'index.html')

with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

def replace_css(match):
    filepath = os.path.join(base_dir, match.group(1).replace('/', '\\'))
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return '<style>\n' + f.read() + '\n</style>'
    return match.group(0)

def replace_js(match):
    filepath = os.path.join(base_dir, match.group(1).replace('/', '\\'))
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return '<script>\n' + f.read() + '\n</script>'
    return match.group(0)

html = re.sub(r'<link rel=\"stylesheet\" href=\"(.*?)\">', replace_css, html)
html = re.sub(r'<script src=\"(.*?)\"></script>', replace_js, html)

import base64
def replace_img(match):
    filepath = os.path.join(base_dir, match.group(0).replace('/', '\\'))
    if os.path.exists(filepath):
        with open(filepath, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/png;base64,{b64}"
    return match.group(0)

html = re.sub(r'img/[a-zA-Z0-9_\-]+\.png', replace_img, html)

out_path = os.path.join(base_dir, 'GESTION MAQUINARIA 2026.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

print('Done creating GESTION MAQUINARIA 2026.html!')
