/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Seguimiento y ajuste del avance semanal
 */

window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;

  /**
   * Modal interactivo para visualizar y ajustar avances semanales de cada frente
   */
  F.openWeeklyProgressModal = function openWeeklyProgressModal(frentes) {
    if (!frentes || frentes.length === 0) {
      alert("No hay frentes activos registrados. Primero importe un archivo Excel.");
      return;
    }

    const rowsHtml = frentes.map((f, idx) => {
      const { act: actVal, ant: antVal } = F.getAvance(f);
      const delta = actVal - antVal;
      const deltaClass = delta > 0 ? 'badge-delta-pos' : (delta < 0 ? 'badge-delta-neg' : 'badge-delta-zero');
      const deltaSign = delta > 0 ? '+' : '';

      return `
        <tr data-index="${idx}" style="border-bottom: 1px solid var(--card-border);">
          <td style="padding: 8px 10px; font-weight: 600; color: var(--text-heading);">
            📍 ${window.AppHelpers.escapeHTML(f.municipality)}
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 400;">${window.AppHelpers.escapeHTML(f.name)}</div>
          </td>
          <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-secondary);">
            ${window.AppHelpers.escapeHTML(f.subregion || f.metadata?.subregion || 'N/E')}
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <input type="number" min="0" max="100" class="form-control input-ant" data-idx="${idx}" value="${antVal}" style="width: 75px; text-align: center; display: inline-block; padding: 4px;" /> %
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <input type="number" min="0" max="100" class="form-control input-act" data-idx="${idx}" value="${actVal}" style="width: 75px; text-align: center; display: inline-block; padding: 4px; font-weight: bold;" /> %
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <span class="badge-delta ${deltaClass} delta-display-${idx}">${deltaSign}${delta}%</span>
          </td>
        </tr>
      `;
    }).join('');

    const modalHTML = `
      <div class="modal-overlay active" id="modal-weekly-progress">
        <div class="modal-content" style="max-width: 820px; width: 95%; max-height: 90vh; display: flex; flex-direction: column; background: var(--card-bg); padding: 0;">
          <div class="modal-header" style="background: var(--primary-dark); color: white; padding: 12px 20px; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
            <div class="modal-title" style="display:flex; align-items:center; gap:8px; color: white;">
              <span>📊</span> Seguimiento de Avance Semanal (Comparativa vs Semana Anterior)
            </div>
            <button type="button" class="modal-close" id="modal-close-weekly" style="color: white;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 15px 20px; overflow-y: auto; flex-grow: 1;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0; margin-bottom: 12px;">
              Aquí puedes revisar y ajustar el avance porcentual (%) de cada frente de obra en la semana anterior y la semana actual. El incremento semanal (Δ) se recalcula automáticamente.
            </p>
            <div class="table-container" style="border: 1px solid var(--card-border); border-radius: 6px; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background: var(--bg-subtle); color: var(--text-primary); border-bottom: 2px solid var(--card-border); text-align: left;">
                    <th style="padding: 10px;">Frente / Municipio</th>
                    <th style="padding: 10px;">Subregión</th>
                    <th style="padding: 10px; text-align: center;">Sem. Anterior</th>
                    <th style="padding: 10px; text-align: center;">Sem. Actual</th>
                    <th style="padding: 10px; text-align: center;">Incremento Semanal (Δ)</th>
                  </tr>
                </thead>
                <tbody id="tbody-weekly-progress">
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer" style="padding: 12px 20px; background: var(--bg-subtle); border-top: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Total Frentes: <strong>${frentes.length}</strong></span>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-weekly">Cancelar</button>
              <button type="button" class="btn btn-primary" id="btn-save-weekly" style="background-color: var(--primary-green); border-color: var(--primary-green);">
                💾 Guardar Cambios de Avance
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('modal-weekly-progress');
    const closeModal = () => modal.remove();

    document.getElementById('modal-close-weekly').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-weekly').addEventListener('click', closeModal);

    // Live recalculation on input change
    const updateRowDelta = (idx) => {
      const inputAnt = modal.querySelector(`.input-ant[data-idx="${idx}"]`);
      const inputAct = modal.querySelector(`.input-act[data-idx="${idx}"]`);
      const badge = modal.querySelector(`.delta-display-${idx}`);
      if (!inputAnt || !inputAct || !badge) return;

      const ant = Math.min(100, Math.max(0, parseInt(inputAnt.value, 10) || 0));
      const act = Math.min(100, Math.max(0, parseInt(inputAct.value, 10) || 0));
      const delta = act - ant;

      badge.className = `badge-delta delta-display-${idx} ${delta > 0 ? 'badge-delta-pos' : (delta < 0 ? 'badge-delta-neg' : 'badge-delta-zero')}`;
      badge.textContent = `${delta > 0 ? '+' : ''}${delta}%`;
    };

    modal.querySelectorAll('.input-ant, .input-act').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        updateRowDelta(idx);
      });
    });

    // Save changes into AppStore
    document.getElementById('btn-save-weekly').addEventListener('click', () => {
      const updatedFrentes = frentes.map(f => ({ ...f, metadata: { ...(f.metadata || {}) } }));
      updatedFrentes.forEach((f, idx) => {
        const inputAnt = modal.querySelector(`.input-ant[data-idx="${idx}"]`);
        const inputAct = modal.querySelector(`.input-act[data-idx="${idx}"]`);
        if (inputAnt && inputAct) {
          const ant = Math.min(100, Math.max(0, parseInt(inputAnt.value, 10) || 0));
          const act = Math.min(100, Math.max(0, parseInt(inputAct.value, 10) || 0));
          const delta = act - ant;
          f.metadata.avanceAnterior = ant;
          f.metadata.avanceActual = act;
          f.metadata.deltaSemanal = delta;
          f.metadata.avance = `${act}%`;
        }
      });

      closeModal();
      window.AppStore.updateState('frentesActivos', updatedFrentes);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
})();
