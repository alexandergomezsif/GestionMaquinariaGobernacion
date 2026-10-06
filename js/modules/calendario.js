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
  let currentDateOffset = new Date();
  const esc = str => window.AppHelpers.escapeHTML(str);
  const pad = num => String(num).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function eventCssClass(ev) {
    if (ev.type === 'informe-mensual') return 'event-informe-mensual';
    if (ev.type === 'tarea') return 'event-fin-mes';
    if (ev.type === 'cronograma') return 'event-informe-mensual';
    return 'event-informe-semanal';
  }

  function eventsOn(allEvents, dateStr) {
    return allEvents
      .filter(e => e.date && String(e.date).startsWith(dateStr))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function renderEventChip(ev) {
    return `<div class="calendar-event ${eventCssClass(ev)}" data-event-id="${esc(ev.id)}" title="${esc(ev.title)}">${esc(ev.title)}</div>`;
  }

  function renderDayList(allEvents, d, isToday) {
    const dateStr = toISO(d);
    const evs = eventsOn(allEvents, dateStr);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `
      <div class="calendar-list-day calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}" style="cursor: pointer;">
        <h4>${dayNames[d.getDay()]} ${d.getDate()} <span class="calendar-add-btn" style="float:right; opacity:0.5;">➕</span></h4>
        ${evs.length === 0 ? '<div style="font-size:0.75rem; color: var(--text-muted);">Sin eventos</div>' : evs.map(ev => `
          <div style="margin-bottom:4px;">
            <div style="font-size:0.7rem; color: var(--text-muted);">${esc(String(ev.date).split(' ')[1] ? window.AppHelpers.formatDateTime12h(ev.date).split(' ').slice(1).join(' ') : 'Todo el día')}</div>
            ${renderEventChip(ev)}
          </div>`).join('')}
      </div>`;
  }

  window.AppModules.calendario = function renderCalendarioModule(container) {
    container.innerHTML = `
      <div class="fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-heading);">Calendario Institucional Integrado</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Consolida agenda, órdenes de mantenimiento, fechas límite de informes y actividades del cronograma. Haga clic en un día para agregar una actividad.</p>
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
            <h3 id="calendar-header-title" style="font-size: 1.2rem; font-weight: 700; color: var(--text-heading);">--</h3>
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
    const todayStr = window.AppHelpers.todayISO();
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
        const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
        const isToday = dateStr === todayStr;

        // Filtrar eventos dinámicos para este día
        const eventsHTML = eventsOn(allEvents, dateStr).map(renderEventChip).join('');

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
      const start = new Date(currentDateOffset.getFullYear(), currentDateOffset.getMonth(), currentDateOffset.getDate() - currentDateOffset.getDay());
      const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
      const end = days[6];
      titleEl.textContent = `Semana del ${start.getDate()} de ${monthNames[start.getMonth()]} al ${end.getDate()} de ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
      gridWrapper.innerHTML = `<div class="calendar-week-grid">${days.map(d => renderDayList(allEvents, d, toISO(d) === todayStr)).join('')}</div>`;
    } else {
      titleEl.textContent = `Día: ${currentDateOffset.getDate()} de ${monthNames[currentDateOffset.getMonth()]} de ${currentDateOffset.getFullYear()}`;
      gridWrapper.innerHTML = renderDayList(allEvents, currentDateOffset, toISO(currentDateOffset) === todayStr);
    }

    // Event Delegation for Adding Event on specific date
    gridWrapper.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
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
                  <input type="text" id="cro-responsible" class="form-control" value="${esc(window.AppHelpers.getUserName())}" required />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Fecha Programada</label>
                  <input type="date" id="cro-date" class="form-control" value="${esc(dateStr)}" required />
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
      closeModal();
      window.AppStore.updateState('cronograma', updated);
    });
  }
})();

