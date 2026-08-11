/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 4: Calendario (Agregador Unificado de Eventos Dinámicos)
 * 
 * Cumplimiento Estricto: El calendario NUNCA almacena datos independientes.
 * Genera eventos automáticamente desde Agenda, Tareas, Informes, Vencimientos y Recordatorios.
 */

window.AppModules = window.AppModules || {};

(function() {
  let currentCalendarView = 'monthly';
  let currentDateOffset = new Date(2026, 6, 23);

  window.AppModules.calendario = function renderCalendarioModule(container) {
    container.innerHTML = `
      <div class="fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Calendario Institucional Integrado</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Consolidado dinámico en tiempo real de comités, entregas de informes, vencimientos de tareas y contratos.</p>
          </div>
          
          <div class="filter-group">
            <button class="btn ${currentCalendarView === 'daily' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-daily">Día</button>
            <button class="btn ${currentCalendarView === 'weekly' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-weekly">Semana</button>
            <button class="btn ${currentCalendarView === 'monthly' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-monthly">Mes</button>
          </div>
        </div>

        <div class="card">
          <div class="calendar-controls">
            <button class="btn btn-secondary" id="btn-cal-prev">◀ Anterior</button>
            <h3 id="calendar-header-title" style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark);">--</h3>
            <button class="btn btn-secondary" id="btn-cal-next">Siguiente ▶</button>
          </div>

          <div id="calendar-grid-wrapper">
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-view-daily').addEventListener('click', () => { currentCalendarView = 'daily'; renderCalendarioModule(container); });
    document.getElementById('btn-view-weekly').addEventListener('click', () => { currentCalendarView = 'weekly'; renderCalendarioModule(container); });
    document.getElementById('btn-view-monthly').addEventListener('click', () => { currentCalendarView = 'monthly'; renderCalendarioModule(container); });

    document.getElementById('btn-cal-prev').addEventListener('click', () => {
      if (currentCalendarView === 'monthly') currentDateOffset.setMonth(currentDateOffset.getMonth() - 1);
      else if (currentCalendarView === 'weekly') currentDateOffset.setDate(currentDateOffset.getDate() - 7);
      else currentDateOffset.setDate(currentDateOffset.getDate() - 1);
      renderGrid();
    });

    document.getElementById('btn-cal-next').addEventListener('click', () => {
      if (currentCalendarView === 'monthly') currentDateOffset.setMonth(currentDateOffset.getMonth() + 1);
      else if (currentCalendarView === 'weekly') currentDateOffset.setDate(currentDateOffset.getDate() + 7);
      else currentDateOffset.setDate(currentDateOffset.getDate() + 1);
      renderGrid();
    });

    renderGrid();
  };

  function renderGrid() {
    const titleEl = document.getElementById('calendar-header-title');
    const gridWrapper = document.getElementById('calendar-grid-wrapper');
    if (!gridWrapper) return;

    // Obtener la totalidad de eventos unificados desde el AppStore
    const allEvents = window.AppStore.getUnifiedCalendarEvents();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    if (currentCalendarView === 'monthly') {
      const year = currentDateOffset.getFullYear();
      const month = currentDateOffset.getMonth();
      titleEl.textContent = `${monthNames[month]} ${year}`;

      const firstDayIndex = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const lastDayPrevMonth = new Date(year, month, 0).getDate();

      let gridHTML = `
        <div class="calendar-grid">
          <div class="calendar-day-header">Dom</div>
          <div class="calendar-day-header">Lun</div>
          <div class="calendar-day-header">Mar</div>
          <div class="calendar-day-header">Mié</div>
          <div class="calendar-day-header">Jue</div>
          <div class="calendar-day-header">Vie</div>
          <div class="calendar-day-header">Sáb</div>
      `;

      for (let x = firstDayIndex; x > 0; x--) {
        const prevDate = lastDayPrevMonth - x + 1;
        gridHTML += `<div class="calendar-cell other-month"><span class="calendar-date-num">${prevDate}</span></div>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === 23 && month === 6 && year === 2026;
        const pad = num => String(num).padStart(2, '0');
        const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;

        // Filtrar eventos dinámicos para este día
        const dayEvents = allEvents.filter(e => e.date === dateStr || (e.date && e.date.startsWith(dateStr)));

        let eventsHTML = dayEvents.map(ev => {
          let cssClass = 'event-informe-semanal';
          if (ev.type === 'informe-mensual') cssClass = 'event-informe-mensual';
          if (ev.type === 'vencimiento-contrato') cssClass = 'event-vencimiento';
          if (ev.type === 'tarea') cssClass = 'event-fin-mes';
          if (ev.type === 'cronograma') cssClass = 'event-informe-mensual'; // Reusing green color for Cronograma

          return `<div class="calendar-event ${cssClass}" data-event-id="${ev.id}" title="${ev.title}">${ev.title}</div>`;
        }).join('');

        gridHTML += `
          <div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}" style="cursor: pointer; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="calendar-date-num">${day}</span>
              <span class="calendar-add-btn" style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.5;">➕</span>
            </div>
            ${eventsHTML}
          </div>
        `;
      }

      gridHTML += `</div>`;
      gridWrapper.innerHTML = gridHTML;

    } else if (currentCalendarView === 'weekly') {
      titleEl.textContent = `Semana del ${currentDateOffset.getDate()} de ${monthNames[currentDateOffset.getMonth()]}`;
      gridWrapper.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">
          <p style="font-weight: bold;">Vista Semanal Integrada</p>
          <p>Consolidando <strong>${allEvents.length} eventos dinámicos</strong> registrados en el almacén central.</p>
        </div>
      `;
    } else {
      titleEl.textContent = `Día: ${currentDateOffset.getDate()} de ${monthNames[currentDateOffset.getMonth()]} de ${currentDateOffset.getFullYear()}`;
      gridWrapper.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">
          <p style="font-weight: bold;">Vista Diaria de Compromisos</p>
          <p>Todos los eventos provienen directamente del modelo relacional unificado.</p>
        </div>
      `;
    }

    // Event Delegation for Adding Event on specific date
    gridWrapper.querySelectorAll('.calendar-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.getAttribute('data-date');
        if (dateStr) {
          openCronogramaModal(dateStr);
        }
      });
    });

    // Event Delegation for Viewing Event Details
    gridWrapper.querySelectorAll('.calendar-event').forEach(evEl => {
      evEl.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent cell click
        const id = e.currentTarget.getAttribute('data-event-id');
        const ev = allEvents.find(item => String(item.id) === String(id));
        if (ev) {
          const isDeletable = ev.type === 'cronograma' || ev.type === 'agenda';
          const deleteBtnHtml = isDeletable 
            ? `<button class="btn btn-danger btn-sm" id="btn-delete-event-modal" style="margin-top: 15px; width: 100%;">🗑️ Eliminar Evento / Cita</button>`
            : '';

          window.AppHelpers.showModal('Detalle del Evento', `
            <div style="padding: 10px; font-size: 1rem;">
              <p style="margin-bottom: 8px;"><strong>Evento:</strong> ${window.AppHelpers.escapeHTML(ev.title)}</p>
              <p style="margin-bottom: 8px;"><strong>Fecha y Hora:</strong> ${window.AppHelpers.formatDateTime12h(ev.date)}</p>
              <p style="margin-bottom: 8px;"><strong>Tipo/Categoría:</strong> <span class="badge badge-info">${window.AppHelpers.escapeHTML(ev.type.toUpperCase())}</span></p>
              ${ev.notes ? `<p style="margin-bottom: 8px;"><strong>Observaciones:</strong><br/>${window.AppHelpers.escapeHTML(ev.notes)}</p>` : ''}
              ${deleteBtnHtml}
            </div>
          `);

          if (isDeletable) {
            document.getElementById('btn-delete-event-modal').addEventListener('click', () => {
              if (confirm('¿Está seguro de eliminar este evento/cita?')) {
                const state = window.AppStore.getState();
                if (ev.type === 'cronograma') {
                  const updated = (state.cronograma || []).filter(i => i.id !== ev.id);
                  window.AppStore.updateState('cronograma', updated);
                } else if (ev.type === 'agenda') {
                  const updated = (state.agenda || []).filter(i => i.id !== ev.id);
                  window.AppStore.updateState('agenda', updated);
                }
                const modalEl = document.getElementById('generic-modal');
                if (modalEl) modalEl.remove();
                
                // Re-render Calendar to reflect deletion
                const mainContainer = document.getElementById('app-main');
                window.AppModules.calendario(mainContainer);
              }
            });
          }
        }
      });
    });
  }

  function openCronogramaModal(dateStr) {
    const modalHTML = `
      <div class="modal-overlay active" id="modal-cronograma">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">➕ Agregar Actividad al Cronograma</div>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="form-cronograma">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre de la Actividad</label>
                <input type="text" id="cro-activity" class="form-control" required placeholder="Ej: Visita técnica de supervisión" />
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Frecuencia</label>
                  <select id="cro-frequency" class="form-control">
                    <option value="Única vez">Única vez</option>
                    <option value="Diario">Diario</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Responsable</label>
                  <input type="text" id="cro-responsible" class="form-control" value="Alexander Gómez Avendaño" required />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Fecha Programada</label>
                  <input type="date" id="cro-date" class="form-control" value="${dateStr}" required />
                </div>
                <div class="form-group">
                  <label>Hora Programada</label>
                  <input type="time" id="cro-hora" class="form-control" value="09:00" required />
                </div>
              </div>

              <div class="form-group">
                <label>Estado Inicial</label>
                <select id="cro-status" class="form-control">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>

              <div class="form-group">
                <label>Observaciones / Notas</label>
                <textarea id="cro-notes" class="form-control" rows="2" placeholder="Agregue información adicional aquí..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Actividad</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modal-cronograma');
    const closeModal = () => modal.remove();

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    document.getElementById('form-cronograma').addEventListener('submit', (e) => {
      e.preventDefault();
      const state = window.AppStore.getState();
      const currentList = state.cronograma || [];

      const newItem = {
        id: window.AppHelpers.generateUUID(),
        actividad: document.getElementById('cro-activity').value.trim(),
        frecuencia: document.getElementById('cro-frequency').value,
        responsable: document.getElementById('cro-responsible').value.trim(),
        fecha: document.getElementById('cro-date').value + ' ' + document.getElementById('cro-hora').value,
        status: document.getElementById('cro-status').value,
        observaciones: document.getElementById('cro-notes').value.trim()
      };

      const updated = [newItem, ...currentList];
      window.AppStore.updateState('cronograma', updated);
      closeModal();
      
      // Re-render Calendar to show the new event
      const mainContainer = document.getElementById('app-main');
      window.AppModules.calendario(mainContainer);
    });
  }
})();

