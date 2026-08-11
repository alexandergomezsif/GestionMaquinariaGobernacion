/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 12: Obligaciones Contractuales (Seguimiento a las 7 Obligaciones Principales)
 */

window.AppModules = window.AppModules || {};

window.AppModules.obligaciones = function renderObligacionesModule(container) {
  const state = window.AppStore.getState();
  const obligations = state.obligaciones || [];

  container.innerHTML = `
    <div class="fade-in">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Obligaciones Contractuales de Supervisión</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Seguimiento continuo al nivel de avance (%) y estado de las 7 obligaciones del supervisor de contrato.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${obligations.map(obl => `
          <div class="obligation-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="badge badge-info" style="font-size: 0.9rem; padding: 0.4rem 0.75rem;">Obligación N° ${obl.numero}</span>
                <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">${window.AppHelpers.escapeHTML(obl.titulo)}</h3>
              </div>
              <span class="badge badge-success" style="font-size: 1rem; font-weight: 800;">${obl.progress}% Cumplimiento</span>
            </div>

            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
              ${window.AppHelpers.escapeHTML(obl.descripcion)}
            </p>

            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${obl.progress}%;"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--card-border);">
              <span>Última actualización: <strong>${obl.lastUpdate}</strong></span>
              <span>Observaciones: <em>${window.AppHelpers.escapeHTML(obl.notes || 'Sin observaciones.')}</em></span>
              <button class="btn btn-secondary btn-icon btn-update-obl" data-id="${obl.id}" title="Actualizar Avance">✏️ Actualizar Avance</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-update-obl').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = obligations.find(o => o.id === id);
      if (item) openObligationModal(item);
    });
  });
};

function openObligationModal(item) {
  const modalHTML = `
    <div class="modal-overlay active" id="modal-obligation">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">✏️ Actualizar Avance — Obligación N° ${item.numero}</div>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="form-obligation">
          <div class="modal-body">
            <div class="form-group">
              <label>Título</label>
              <input type="text" class="form-control" value="${window.AppHelpers.escapeHTML(item.titulo)}" disabled />
            </div>

            <div class="form-group">
              <label>Porcentaje de Cumplimiento (%)</label>
              <input type="number" id="obl-progress" class="form-control" min="0" max="100" value="${item.progress}" required />
            </div>

            <div class="form-group">
              <label>Observaciones / Bitácora de Gestión</label>
              <textarea id="obl-notes" class="form-control" rows="3" required>${window.AppHelpers.escapeHTML(item.notes || '')}</textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Actualización</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('modal-obligation');
  const closeModal = () => modal.remove();

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

  document.getElementById('form-obligation').addEventListener('submit', (e) => {
    e.preventDefault();
    const state = window.AppStore.getState();
    const currentList = state.obligaciones || [];
    const today = new Date().toISOString().split('T')[0];

    const updatedProgress = parseInt(document.getElementById('obl-progress').value) || 0;
    const updatedNotes = document.getElementById('obl-notes').value.trim();

    const updated = currentList.map(o => o.id === item.id ? {
      ...o,
      progress: updatedProgress,
      notes: updatedNotes,
      lastUpdate: today
    } : o);

    window.AppStore.updateState('obligaciones', updated);
    closeModal();
    const mainContainer = document.getElementById('app-main');
    window.AppModules.obligaciones(mainContainer);
  });
}
