/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Pantalla principal del módulo (listado de tarjetas, búsqueda y acciones)
 */

window.AppModules = window.AppModules || {};
window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;
  let currentSearchQuery = '';

  window.AppModules.frentesActivos = function(container) {
    const state = window.AppStore.getState();
    let frentes = state.frentesActivos || [];

    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      frentes = frentes.filter(f => 
        (f.municipality || '').toLowerCase().includes(q) || 
        (f.name || '').toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-heading);">Frentes Activos</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Gestión de emergencias y puntos críticos con maquinaria asignada.</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="file" id="file-import-csv" accept=".csv, .xlsx" style="display: none;" />
            <button class="btn btn-secondary" id="btn-import-csv" style="background-color: var(--status-info); color: white; border: none;" title="Importar desde Excel">
              📥 Importar Excel (.csv, .xlsx)
            </button>
            <button class="btn btn-secondary" id="btn-weekly-progress" style="background-color: #0284c7; color: white; border: none;" title="Gestionar y comparar avances semanales">
              📊 Avance Semanal
            </button>
            <button class="btn btn-secondary" id="btn-export-frentes-pdf" style="background-color: var(--primary-dark); color: white; border: none;">
              📄 Generar Informe Ejecutivo
            </button>
            <button class="btn btn-primary" id="btn-add-frente">
              ➕ Nuevo Frente Manual
            </button>
          </div>
        </div>

        <div class="filter-bar" style="margin-bottom: 1.5rem;">
          <input type="text" id="frentes-search" class="form-control" placeholder="🔍 Buscar por municipio o frente..." value="${window.AppHelpers.escapeHTML(currentSearchQuery)}" style="max-width: 300px;" />
          <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 10px;">
            <strong>Leyenda:</strong> 
            <span style="display:inline-block; width:12px; height:12px; background:var(--primary-green); border-radius:3px;"></span> Gobernación
            <span style="display:inline-block; width:12px; height:12px; background:var(--status-info); border-radius:3px; margin-left: 10px;"></span> Rentan
            <span style="display:inline-block; width:12px; height:12px; background:#f59e0b; border-radius:3px; margin-left: 10px;"></span> Alquilados
            <button id="btn-open-map" class="btn btn-primary" style="margin-left: 15px; padding: 4px 10px; font-size: 0.8rem;">
              🗺️ Ver Mapa
            </button>
          </div>
        </div>

        ${frentes.length === 0 ? `
          <div style="text-align:center; padding: 3rem; background: var(--card-bg); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚧</div>
            <h3 style="color: var(--text-secondary);">No hay frentes activos registrados</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Importa un archivo CSV con el reporte semanal o crea un frente manualmente.</p>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
            ${frentes.map(frente => F.renderFrenteCard(frente)).join('')}
          </div>
        `}
      </div>
    `;

    document.getElementById('frentes-search').addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      const caret = e.target.selectionStart;
      window.AppModules.frentesActivos(container);
      const input = document.getElementById('frentes-search');
      if (input) { input.focus(); input.setSelectionRange(caret, caret); }
    });

    document.getElementById('btn-add-frente').addEventListener('click', () => {
      alert("Función de creación manual en desarrollo. Usa la importación CSV por ahora.");
    });

    F.bindMapa();
    F.bindImportador();

    const btnWeeklyProgress = document.getElementById('btn-weekly-progress');
    if (btnWeeklyProgress) {
      btnWeeklyProgress.addEventListener('click', () => {
        F.openWeeklyProgressModal(window.AppStore.getState().frentesActivos || []);
      });
    }

    document.getElementById('btn-export-frentes-pdf').addEventListener('click', () => {
      F.generateFrentesPDF(state.frentesActivos || []);
    });
  };
})();
