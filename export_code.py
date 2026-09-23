import os

# Destination file
dest_dir = r"C:\Users\SuperUsuario\.gemini\antigravity\scratch\sistema_gestion_contrato\Backup\CODIGO COMPLETO PARA REVISAR"
dest_file = os.path.join(dest_dir, "CODIGO_COMPLETO_SISTEMA_GESTION.txt")

# Directories and extensions to include
base_dir = r"C:\Users\SuperUsuario\.gemini\antigravity\scratch\sistema_gestion_contrato"
valid_extensions = ['.html', '.css', '.js', '.py']

# Specific files or folders to ignore
exclude_dirs = ['.git', 'Backup', 'img', '.tempmediaStorage', '.user_uploaded', 'Manual web', 'FentesActivos', 'HOJAS DE VIDA SIF 621']
exclude_files = ['GESTION MAQUINARIA 2026.html', 'index_bundle.html'] # Bundled files are just concatenations

with open(dest_file, 'w', encoding='utf-8') as outfile:
    outfile.write("="*80 + "\n")
    outfile.write("CÓDIGO FUENTE COMPLETO - SISTEMA DE GESTIÓN DEL CONTRATO\n")
    outfile.write("="*80 + "\n\n")

    for root, dirs, files in os.walk(base_dir):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            # Check extensions and excluded files
            if any(file.endswith(ext) for ext in valid_extensions) and file not in exclude_files:
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, base_dir)

                outfile.write("\n" + "="*80 + "\n")
                outfile.write(f"ARCHIVO: {rel_path}\n")
                outfile.write("="*80 + "\n\n")

                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read() + "\n")
                except Exception as e:
                    outfile.write(f"[Error leyendo el archivo: {e}]\n")

print(f"Código completo guardado exitosamente en: {dest_file}")
