/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 13: Base de Datos (Respaldo y Restauración Exclusivamente en Formato JSON)
 */

window.AppModules = window.AppModules || {};

window.AppModules.baseDatos = function renderBaseDatosModule(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-size: 1.6rem; font-weight: 700; color: var(--primary-dark);">Administración de Base de Datos y Respaldo</h2>
        <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 600px; margin: 0.5rem auto 0 auto;">
          Persistencia de datos mediante archivos estructurados JSON. Guarde copias de seguridad de toda la información operativa del contrato o restaure un respaldo previo sin conexión a internet.
        </p>
      </div>

      <div class="database-actions-container">
        <!-- Botón 1: Descargar respaldo -->
        <div class="db-btn-wrapper">
          <div style="font-size: 2.5rem;">📥</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-dark);">Descargar respaldo</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
            Exporta la totalidad del objeto de datos en memoria (maquinaria, contratos, informes, tareas y agenda) a un archivo plano de formato JSON.
          </p>
          <button class="btn btn-primary" id="btn-export-json" style="padding: 0.75rem 1.75rem; font-size: 1rem; width: 100%;">
            💾 Exportar Respaldo JSON
          </button>
        </div>

        <!-- Botón 2: Cargar respaldo -->
        <div class="db-btn-wrapper">
          <div style="font-size: 2.5rem;">📤</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-dark);">Cargar respaldo</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
            Seleccione un archivo de respaldo JSON generado previamente. El sistema validará su integridad y actualizará reactivamente toda la interfaz.
          </p>
          <input type="file" id="input-import-json" accept=".json" style="display: none;" />
          <button class="btn btn-secondary" id="btn-import-json" style="padding: 0.75rem 1.75rem; font-size: 1rem; width: 100%; border-color: var(--primary-green); color: var(--primary-green);">
            📂 Seleccionar Archivo JSON
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-export-json').addEventListener('click', () => {
    window.AppStore.exportJSONBackup();
  });

  const fileInput = document.getElementById('input-import-json');
  document.getElementById('btn-import-json').addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const res = window.AppStore.importJSONBackup(content);
      if (res.success) {
        alert('✅ ' + res.message);
      } else {
        alert('❌ ' + res.message);
      }
    };
    reader.readAsText(file);
  });
};
