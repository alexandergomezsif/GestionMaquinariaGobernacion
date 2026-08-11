/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 6: Órdenes de Mantenimiento (Reemplazo Funcional de Tareas)
 */

window.AppModules = window.AppModules || {};

window.AppModules.mantenimientos = function renderMantenimientosModule(container) {
  const state = window.AppStore.getState();
  const mts = state.mantenimientos || [];
  const inventory = state.inventario || [];

  container.innerHTML = `
    <div class="fade-in">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Gestión de Mantenimientos (Órdenes de Trabajo)</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Planificación y control de mantenimientos preventivos y correctivos de la maquinaria.</p>
        </div>
        <button class="btn btn-primary" id="btn-add-mt">
          ➕ Nueva Orden de Trabajo
        </button>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha Programada</th>
                <th>Equipo / Maquinaria</th>
                <th>Tipo</th>
                <th>Descripción del Trabajo</th>
                <th>Responsable / Taller</th>
                <th>Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${mts.length === 0 ? `
                <tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No hay órdenes de mantenimiento registradas.</td></tr>
              ` : mts.map(item => `
                <tr>
                  <td><strong>${window.AppHelpers.escapeHTML(item.fecha)}</strong></td>
                  <td>${item.equipoId ? window.AppComponents.renderEntityLink('equipment', item.equipoId) : 'N/A'}</td>
                  <td>
                    <span class="badge ${item.tipo === 'Correctivo' ? 'badge-danger' : 'badge-warning'}">
                      ${window.AppHelpers.escapeHTML(item.tipo)}
                    </span>
                  </td>
                  <td>${window.AppHelpers.escapeHTML(item.descripcion)}</td>
                  <td>${window.AppHelpers.escapeHTML(item.responsable)}</td>
                  <td>
                    <span class="badge ${item.estado === 'Completado' ? 'badge-success' : item.estado === 'En Proceso' ? 'badge-info' : 'badge-neutral'}">
                      ${window.AppHelpers.escapeHTML(item.estado)}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-icon btn-edit-mt" data-id="${item.id}" title="Editar">✏️</button>
                    <button class="btn btn-danger btn-icon btn-delete-mt" data-id="${item.id}" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-add-mt').addEventListener('click', () => openMtModal());

  container.querySelectorAll('.btn-edit-mt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = mts.find(t => t.id === id);
      if (item) openMtModal(item);
    });
  });

  container.querySelectorAll('.btn-delete-mt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Está seguro de eliminar esta orden de trabajo?')) {
        const updated = mts.filter(t => t.id !== id);
        window.AppStore.updateState('mantenimientos', updated);
        renderMantenimientosModule(container);
      }
    });
  });

  function openMtModal(itemToEdit = null) {
    const isEdit = !!itemToEdit;
    const modalHTML = `
      <div class="modal-overlay active" id="modal-mt">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '✏️ Editar Orden de Trabajo' : '➕ Nueva Orden de Mantenimiento'}</div>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="form-mt">
            <div class="modal-body">
              <div class="form-group">
                <label>Maquinaria / Equipo</label>
                <select id="mt-equipo" class="form-control" required>
                  <option value="">Seleccione un equipo...</option>
                  ${inventory.map(eq => `
                    <option value="${eq.id}" ${isEdit && itemToEdit.equipoId === eq.id ? 'selected' : ''}>
                      ${window.AppHelpers.escapeHTML(eq.equipment)} (${window.AppHelpers.escapeHTML(eq.plate || eq.serial)})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Tipo de Mantenimiento</label>
                  <select id="mt-tipo" class="form-control">
                    <option value="Preventivo" ${isEdit && itemToEdit.tipo === 'Preventivo' ? 'selected' : ''}>Preventivo</option>
                    <option value="Correctivo" ${isEdit && itemToEdit.tipo === 'Correctivo' ? 'selected' : ''}>Correctivo</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Fecha Programada</label>
                  <input type="date" id="mt-fecha" class="form-control" value="${isEdit ? itemToEdit.fecha : window.AppHelpers.getFormattedCurrentDate().split('/').reverse().join('-')}" required />
                </div>
              </div>

              <div class="form-group">
                <label>Descripción del Trabajo a Realizar</label>
                <textarea id="mt-desc" class="form-control" rows="2" required>${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.descripcion) : ''}</textarea>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Responsable / Taller</label>
                  <input type="text" id="mt-resp" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.responsable) : 'Taller Central'}" required />
                </div>
                <div class="form-group">
                  <label>Estado de la Orden</label>
                  <select id="mt-estado" class="form-control">
                    <option value="Pendiente" ${isEdit && itemToEdit.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En Proceso" ${isEdit && itemToEdit.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                    <option value="Completado" ${isEdit && itemToEdit.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Generar Orden'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modal-mt');
    const closeModal = () => modal.remove();

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    document.getElementById('form-mt').addEventListener('submit', (e) => {
      e.preventDefault();
      const state = window.AppStore.getState();
      const currentMts = state.mantenimientos || [];

      const newItem = {
        id: isEdit ? itemToEdit.id : window.AppHelpers.generateUUID(),
        equipoId: document.getElementById('mt-equipo').value,
        tipo: document.getElementById('mt-tipo').value,
        fecha: document.getElementById('mt-fecha').value,
        descripcion: document.getElementById('mt-desc').value.trim(),
        responsable: document.getElementById('mt-resp').value.trim(),
        estado: document.getElementById('mt-estado').value
      };

      let updated;
      if (isEdit) {
        updated = currentMts.map(t => t.id === itemToEdit.id ? newItem : t);
      } else {
        updated = [newItem, ...currentMts];
      }

      window.AppStore.updateState('mantenimientos', updated);
      closeModal();
      const mainContainer = document.getElementById('app-main');
      window.AppModules.mantenimientos(mainContainer);
    });
  }
};
