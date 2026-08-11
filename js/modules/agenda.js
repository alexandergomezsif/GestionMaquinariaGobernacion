/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 3: Agenda (Gestión de Citas, Comités e Inspecciones - Vista de Hoy)
 */

window.AppModules = window.AppModules || {};

window.AppModules.agenda = function renderAgendaModule(container) {
  const state = window.AppStore.getState();
  const todayStr = window.AppHelpers.getFormattedCurrentDate(); // just for display
  const isoDate = new Date().toISOString().split('T')[0];

  // Filtrar solo los de hoy y los próximos
  const agendaList = (state.agenda || []).filter(a => a.fecha >= isoDate).sort((a, b) => a.fecha.localeCompare(b.fecha));

  container.innerHTML = `
    <div class="fade-in">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Agenda y Próximos Eventos</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Eventos programados a partir de hoy: <strong>${todayStr}</strong></p>
        </div>
        <button class="btn btn-primary" id="btn-add-agenda">
          ➕ Nueva Cita / Comité
        </button>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Título del Evento</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Notas</th>
                <th style="text-align: right;">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              ${agendaList.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 2rem;">No hay eventos agendados para hoy. ¡Tienes el día libre!</td></tr>
              ` : agendaList.map(item => `
                <tr style="${item.status === 'Completado' ? 'opacity: 0.6;' : ''}">
                  <td><strong>${window.AppHelpers.formatDateTime12h(item.fecha)}</strong></td>
                  <td style="${item.status === 'Completado' ? 'text-decoration: line-through;' : ''}">${window.AppHelpers.escapeHTML(item.titulo)}</td>
                  <td><span class="badge badge-info">${window.AppHelpers.escapeHTML(item.categoria)}</span></td>
                  <td>
                    <span class="badge ${item.status === 'Completado' ? 'badge-success' : 'badge-warning'}">
                      ${window.AppHelpers.escapeHTML(item.status)}
                    </span>
                  </td>
                  <td>${window.AppHelpers.escapeHTML(item.notes || '-')}</td>
                  <td style="text-align: right; display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-info btn-icon btn-view-agenda" data-id="${item.id}" title="Ver Detalles">👁️</button>
                    ${item.status !== 'Completado' ? `
                      <button class="btn btn-success btn-icon btn-complete-agenda" data-id="${item.id}" title="Marcar Completado">✅</button>
                    ` : `
                      <button class="btn btn-secondary btn-icon btn-pending-agenda" data-id="${item.id}" title="Marcar Pendiente">🔄</button>
                    `}
                    <button class="btn btn-danger btn-icon btn-delete-agenda" data-id="${item.id}" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-add-agenda').addEventListener('click', () => openAgendaModal());

  // Acciones Rápidas
  container.querySelectorAll('.btn-complete-agenda').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      updateStatus(id, 'Completado');
    });
  });

  container.querySelectorAll('.btn-pending-agenda').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      updateStatus(id, 'Pendiente');
    });
  });

  container.querySelectorAll('.btn-delete-agenda').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Está seguro de eliminar esta cita de la agenda?')) {
        const updated = (window.AppStore.getState().agenda || []).filter(a => a.id !== id);
        window.AppStore.updateState('agenda', updated);
        renderAgendaModule(container);
      }
    });
  });

  container.querySelectorAll('.btn-view-agenda').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = (window.AppStore.getState().agenda || []).find(a => a.id === id);
      if (item) {
        window.AppHelpers.showModal('Detalles de Agenda', `
          <div style="padding: 10px;">
            <p><strong>Título:</strong> ${window.AppHelpers.escapeHTML(item.titulo)}</p>
            <p><strong>Fecha y Hora:</strong> ${window.AppHelpers.formatDateTime12h(item.fecha)}</p>
            <p><strong>Categoría:</strong> ${window.AppHelpers.escapeHTML(item.categoria)}</p>
            <p><strong>Estado:</strong> ${window.AppHelpers.escapeHTML(item.status)}</p>
            <p><strong>Notas:</strong> <br/> ${window.AppHelpers.escapeHTML(item.notes || 'Ninguna')}</p>
          </div>
        `);
      }
    });
  });

  function updateStatus(id, newStatus) {
    const agenda = window.AppStore.getState().agenda || [];
    const updated = agenda.map(a => a.id === id ? { ...a, status: newStatus } : a);
    window.AppStore.updateState('agenda', updated);
    renderAgendaModule(container);
  }
};

function openAgendaModal() {
  const isoDate = new Date().toISOString().split('T')[0];
  const modalHTML = `
    <div class="modal-overlay active" id="modal-agenda">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">➕ Nuevo Evento para Hoy</div>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="form-agenda">
          <div class="modal-body">
            <div class="form-group">
              <label>Título del Evento / Comité</label>
              <input type="text" id="ag-titulo" class="form-control" required placeholder="Ej: Comité Técnico de Maquinaria" />
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label>Categoría</label>
                <select id="ag-categoria" class="form-control">
                  <option value="Reunión">Reunión</option>
                  <option value="Inspección">Inspección de Campo</option>
                  <option value="Financiero">Revisión Financiera</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>

              <div class="form-group">
                <label>Hora</label>
                <input type="time" id="ag-hora" class="form-control" value="09:00" required />
              </div>
            </div>

            <div class="form-group">
              <label>Notas / Observaciones</label>
              <textarea id="ag-notes" class="form-control" rows="3"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
            <button type="submit" class="btn btn-primary">Agendar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('modal-agenda');
  const closeModal = () => modal.remove();

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

  document.getElementById('form-agenda').addEventListener('submit', (e) => {
    e.preventDefault();
    const state = window.AppStore.getState();
    const currentAgenda = state.agenda || [];

    const hora = document.getElementById('ag-hora').value;
    const newItem = {
      id: window.AppHelpers.generateUUID(),
      titulo: document.getElementById('ag-titulo').value.trim(),
      categoria: document.getElementById('ag-categoria').value,
      fecha: `${isoDate} ${hora}`,
      priority: 'Media', // Default
      status: 'Pendiente',
      notes: document.getElementById('ag-notes').value.trim()
    };

    const updated = [newItem, ...currentAgenda];
    window.AppStore.updateState('agenda', updated);
    closeModal();
    const mainContainer = document.getElementById('app-main');
    window.AppModules.agenda(mainContainer);
  });
}
