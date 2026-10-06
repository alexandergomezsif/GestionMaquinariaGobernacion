/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 13: Base de Datos (Respaldo y Restauración Exclusivamente en Formato JSON)
 */

window.AppModules = window.AppModules || {};

window.AppModules.baseDatos = function renderBaseDatosModule(container) {
  const info = window.AppStore.getStorageInfo();
  const fmt = iso => iso ? new Date(iso).toLocaleString('es-CO') : 'Nunca';
  const state = window.AppStore.getState();
  const historial = state.historialFrentes || [];
  container.innerHTML = `
    <div class="fade-in">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-size: 1.6rem; font-weight: 700; color: var(--text-heading);">Administración de Base de Datos y Respaldo</h2>
        <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 600px; margin: 0.5rem auto 0 auto;">
          Los cambios se guardan automáticamente en este navegador. El respaldo JSON es la única copia fuera de él: expórtelo con frecuencia y guárdelo en una carpeta sincronizada.
        </p>
      </div>

      <div class="card" style="max-width: 760px; margin: 0 auto 1.5rem auto;">
        <table class="import-summary-table">
          <tr><td>Almacenamiento en uso</td><td>${info.mode === 'indexeddb' ? 'IndexedDB (navegador)' : 'localStorage (limitado ≈5 MB)'}</td></tr>
          <tr><td>Último guardado automático</td><td>${fmt(info.lastSavedAt)}</td></tr>
          <tr><td>Último respaldo JSON exportado</td><td>${fmt(info.lastBackupAt)}</td></tr>
          <tr><td>Cambios sin respaldar</td><td>${info.dirtySinceBackup ? 'Sí' : 'No'}</td></tr>
          <tr><td>Semanas de frentes en el histórico</td><td>${historial.length}</td></tr>
          ${info.lastError ? `<tr><td style="color: var(--status-danger);">Último error de guardado</td><td style="color: var(--status-danger);">${window.AppHelpers.escapeHTML(info.lastError)}</td></tr>` : ''}
        </table>
      </div>

      <div class="database-actions-container">
        <!-- Botón 1: Descargar respaldo -->
        <div class="db-btn-wrapper">
          <div style="font-size: 2.5rem;">📥</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-heading);">Descargar respaldo</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
            Exporta toda la información (inventario, mantenimientos, agenda, informes, actas, obligaciones, frentes y su histórico) a un archivo JSON.
          </p>
          <button class="btn btn-primary" id="btn-export-json" style="padding: 0.75rem 1.75rem; font-size: 1rem; width: 100%;">
            💾 Exportar Respaldo JSON
          </button>
        </div>

        <!-- Botón 2: Cargar respaldo -->
        <div class="db-btn-wrapper">
          <div style="font-size: 2.5rem;">📤</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-heading);">Cargar respaldo</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
            Seleccione un respaldo JSON. Reemplaza los datos actuales de este navegador (se pide confirmación). También acepta un archivo frentes_activos_*.json.
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
      if (!confirm('Cargar este respaldo REEMPLAZARÁ los datos actuales de este navegador. ¿Desea continuar? (Sugerencia: exporte primero un respaldo de lo actual.)')) {
        fileInput.value = '';
        return;
      }
      const res = window.AppStore.importJSONBackup(content);
      if (res.success) {
        alert('✅ ' + res.message);
      } else {
        alert('❌ ' + res.message);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
};
