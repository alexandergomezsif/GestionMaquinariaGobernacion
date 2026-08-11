/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 5: Inventario (Control y Seguimiento de Maquinaria Pesada)
 */

window.AppModules = window.AppModules || {};

(function() {
  let currentSearchQuery = '';
  let currentStatusFilter = 'TODOS';
  let currentMunicipalityFilter = 'TODOS';
  let currentSortField = 'equipment';

  window.AppModules.inventario = function renderInventarioModule(container) {
    const state = window.AppStore.getState();
    let inventory = [...(state.inventario || [])];

    const municipalities = Array.from(new Set(inventory.map(i => i.municipality))).sort();

    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      inventory = inventory.filter(i => 
        i.equipment.toLowerCase().includes(q) ||
        i.serial.toLowerCase().includes(q) ||
        (i.plate && i.plate.toLowerCase().includes(q)) ||
        i.location.toLowerCase().includes(q)
      );
    }

    if (currentStatusFilter !== 'TODOS') {
      inventory = inventory.filter(i => i.status === currentStatusFilter);
    }

    if (currentMunicipalityFilter !== 'TODOS') {
      inventory = inventory.filter(i => i.municipality === currentMunicipalityFilter);
    }

    inventory.sort((a, b) => {
      let valA = a[currentSortField] || '';
      let valB = b[currentSortField] || '';
      if (typeof valA === 'string') return valA.localeCompare(valB);
      return valA - valB;
    });

    container.innerHTML = `
      <div class="fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Inventario de Maquinaria Pesada</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Registro oficial de parque automotor, estado operativo e historial básico de servicio.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="btn-export-pdf" style="background-color: var(--primary-dark); color: white; border: none;">
              📄 Presentar Informe (PDF)
            </button>
            <button class="btn btn-primary" id="btn-add-equipment">
              🚜 Agregar Nuevo Equipo
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="filter-group">
            <input type="text" id="inv-search-input" class="form-control" placeholder="🔍 Buscar por equipo, serie, placa..." value="${window.AppHelpers.escapeHTML(currentSearchQuery)}" style="width: 240px;" />
            
            <select id="inv-filter-status" class="form-control">
              <option value="TODOS" ${currentStatusFilter === 'TODOS' ? 'selected' : ''}>Todos los Estados</option>
              <option value="Operativo" ${currentStatusFilter === 'Operativo' ? 'selected' : ''}>Operativo</option>
              <option value="En Mantenimiento" ${currentStatusFilter === 'En Mantenimiento' ? 'selected' : ''}>En Mantenimiento</option>
              <option value="Fuera de Servicio" ${currentStatusFilter === 'Fuera de Servicio' ? 'selected' : ''}>Fuera de Servicio</option>
            </select>

            <select id="inv-filter-mpio" class="form-control">
              <option value="TODOS" ${currentMunicipalityFilter === 'TODOS' ? 'selected' : ''}>Todos los Municipios</option>
              ${municipalities.map(m => `<option value="${window.AppHelpers.escapeHTML(m)}" ${currentMunicipalityFilter === m ? 'selected' : ''}>${window.AppHelpers.escapeHTML(m)}</option>`).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Ordenar por:</label>
            <select id="inv-sort-field" class="form-control">
              <option value="equipment" ${currentSortField === 'equipment' ? 'selected' : ''}>Equipo / Nombre</option>
              <option value="municipality" ${currentSortField === 'municipality' ? 'selected' : ''}>Municipio</option>
              <option value="hourMeter" ${currentSortField === 'hourMeter' ? 'selected' : ''}>Horómetro</option>
              <option value="status" ${currentSortField === 'status' ? 'selected' : ''}>Estado</option>
            </select>
          </div>
        </div>

        <div class="card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Equipo / Marca / Modelo</th>
                  <th>Serie / Placa</th>
                  <th>Ubicación</th>
                  <th>Horómetro</th>
                  <th>Estado</th>
                  <th>Último Servicio</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${inventory.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No se encontraron equipos que coincidan con la búsqueda.</td></tr>
                ` : inventory.map(item => {
                  const isKm = item.equipment.toLowerCase().includes('volqueta') || item.equipment.toLowerCase().includes('camabaja');
                  const unit = isKm ? 'km' : 'hrs';

                  let inactivityAlert = '';
                  if ((item.status === 'Fuera de Servicio' || item.status === 'En Mantenimiento') && item.inoperativeDate) {
                    const inopDate = new Date(item.inoperativeDate);
                    const now = new Date();
                    const diffDays = Math.ceil((now - inopDate) / (1000 * 60 * 60 * 24));
                    let color = '#dc2626'; // roja (> 90 dias o por defecto a mas largo)
                    let width = '100%';
                    if (diffDays < 30) {
                      color = '#f97316'; // naranja claro
                      width = '33%';
                    } else if (diffDays <= 60) {
                      color = '#ea580c'; // naranja oscuro
                      width = '66%';
                    }
                    
                    inactivityAlert = `
                      <div style="margin-top: 6px; background: #e2e8f0; border-radius: 4px; height: 6px; width: 100%; overflow: hidden;" title="${diffDays} días inoperativo">
                        <div style="background: ${color}; height: 100%; width: ${width};"></div>
                      </div>
                      <div style="font-size: 0.7rem; text-align: center; color: var(--text-muted); margin-top: 2px;">
                        ${diffDays} días inoperativo
                      </div>
                    `;
                  }

                  const tooltipText = (item.status === 'Fuera de Servicio' || item.status === 'En Mantenimiento') ? (item.notes || 'Sin detalles') : 'Equipo Operativo';

                  return `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center;">
                        ${window.AppHelpers.getEquipmentIcon(item.equipment)}
                        <div>
                          <strong>${window.AppHelpers.escapeHTML(item.equipment)}</strong>
                          <div style="font-size: 0.78rem; color: var(--text-muted);">${window.AppHelpers.escapeHTML(item.brand)} ${window.AppHelpers.escapeHTML(item.model)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>SN: <code>${window.AppHelpers.escapeHTML(item.serial)}</code></div>
                      <div style="font-size: 0.78rem; color: var(--text-secondary);">Placa: ${window.AppHelpers.escapeHTML(item.plate || 'N/A')}</div>
                    </td>
                    <td>
                      <strong>${window.AppHelpers.escapeHTML(item.municipality)}</strong>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">${window.AppHelpers.escapeHTML(item.location)}</div>
                    </td>
                    <td>
                      <strong>${item.hourMeter.toLocaleString('es-CO')} ${unit}</strong>
                    </td>
                    <td style="width: 140px;">
                      <span class="badge ${item.status === 'Operativo' ? 'badge-success' : item.status === 'En Mantenimiento' ? 'badge-warning' : 'badge-danger'}" 
                            title="${window.AppHelpers.escapeHTML(tooltipText)}" style="cursor: help; width: 100%; display: block; text-align: center;">
                        ${window.AppHelpers.escapeHTML(item.status)}
                      </span>
                      ${inactivityAlert}
                    </td>
                    <td>
                      <div>📅 ${window.AppHelpers.escapeHTML(item.lastServiceDate || 'N/A')}</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">${window.AppHelpers.escapeHTML(item.lastServiceDetails || '-')}</div>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-secondary btn-icon btn-edit-equip" data-id="${item.id}" title="Editar">✏️</button>
                      <button class="btn btn-danger btn-icon btn-delete-equip" data-id="${item.id}" title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('inv-search-input').addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderInventarioModule(container);
    });

    document.getElementById('inv-filter-status').addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      renderInventarioModule(container);
    });

    document.getElementById('inv-filter-mpio').addEventListener('change', (e) => {
      currentMunicipalityFilter = e.target.value;
      renderInventarioModule(container);
    });

    document.getElementById('inv-sort-field').addEventListener('change', (e) => {
      currentSortField = e.target.value;
      renderInventarioModule(container);
    });

    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      generatePDFReport(inventory);
    });

    document.getElementById('btn-add-equipment').addEventListener('click', () => openEquipmentModal());

    container.querySelectorAll('.btn-edit-equip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = state.inventario.find(i => i.id === id);
        if (item) openEquipmentModal(item);
      });
    });

    container.querySelectorAll('.btn-delete-equip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Está seguro de eliminar este equipo del inventario?')) {
          const updated = state.inventario.filter(i => i.id !== id);
          window.AppStore.updateState('inventario', updated);
          renderInventarioModule(container);
        }
      });
    });
  };

  function openEquipmentModal(itemToEdit = null) {
    const isEdit = !!itemToEdit;
    
    // Preparar historiales
    const hourHistory = (isEdit && itemToEdit.hourHistory) ? itemToEdit.hourHistory : [];
    const notesHistory = (isEdit && itemToEdit.notesHistory) ? itemToEdit.notesHistory : [];

    // Generar HTML de historiales
    const renderHourHistory = () => {
      if (hourHistory.length === 0) return '<div style="font-size:0.8rem; color:#666;">Sin historial</div>';
      return hourHistory.map(h => `<div style="font-size:0.75rem; border-bottom:1px solid #eee; padding:2px 0;">• ${h.value} hrs <span style="color:#888;">(${h.date})</span></div>`).join('');
    };

    const renderNotesHistory = () => {
      if (notesHistory.length === 0) return '<div style="font-size:0.8rem; color:#666; padding: 10px;">Sin novedades registradas</div>';
      return notesHistory.map(n => `
        <div style="font-size:0.8rem; border-left: 2px solid var(--primary-green); padding-left: 8px; margin-bottom: 8px; background: #f9f9f9; padding: 6px; border-radius: 4px; position:relative;">
          <div style="font-weight:bold; color:var(--primary-dark); font-size:0.7rem;">${n.author} - ${n.date}</div>
          <div style="margin-top:4px;">${window.AppHelpers.escapeHTML(n.text)}</div>
          <button type="button" class="btn-delete-note" data-id="${n.id}" style="position:absolute; top:4px; right:4px; background:none; border:none; color:red; cursor:pointer;" title="Eliminar Novedad">🗑️</button>
        </div>
      `).join('');
    };

    const readonlyAttr = isEdit ? 'readonly disabled style="background-color: #f1f5f9;"' : '';

    const modalHTML = `
      <div class="modal-overlay active" id="modal-equipment">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '✏️ Editar Equipo de Maquinaria' : '🚜 Agregar Nuevo Equipo'}</div>
            <button type="button" class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="form-equipment">
            <div class="modal-body">
              <div class="form-group">
                <label>Denominación del Equipo</label>
                <input type="text" id="eq-name" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.equipment) : ''}" required placeholder="Ej: Motoniveladora 120K Caterpillar" ${readonlyAttr} />
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Marca</label>
                  <input type="text" id="eq-brand" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.brand) : ''}" required ${readonlyAttr} />
                </div>
                <div class="form-group">
                  <label>Modelo</label>
                  <input type="text" id="eq-model" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.model) : ''}" required ${readonlyAttr} />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Serie (Chasis/Motor)</label>
                  <input type="text" id="eq-serial" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.serial) : ''}" required ${readonlyAttr} />
                </div>
                <div class="form-group">
                  <label>Placa / Código Interno</label>
                  <input type="text" id="eq-plate" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.plate || '') : ''}" ${readonlyAttr} />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Municipio de Ubicación</label>
                  <input type="text" id="eq-mpio" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.municipality) : 'Medellín'}" required />
                </div>
                <div class="form-group">
                  <label>Ubicación Específica / Frente de Obra</label>
                  <input type="text" id="eq-loc" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.location) : ''}" required />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Horómetro (Horas de Uso)</label>
                  <div style="display:flex; gap:10px;">
                    <input type="number" id="eq-hour" class="form-control" value="${isEdit ? itemToEdit.hourMeter : 0}" required ${isEdit ? 'readonly style="background:#f1f5f9;"' : ''} />
                    ${isEdit ? '<button type="button" class="btn btn-secondary" id="btn-update-hour" style="white-space:nowrap;">➕ Actualizar</button>' : ''}
                  </div>
                  ${isEdit ? `
                  <div style="margin-top: 5px; max-height: 80px; overflow-y:auto; background:#fafafa; border:1px solid #ddd; padding:5px; border-radius:4px;" id="hour-history-container">
                    ${renderHourHistory()}
                  </div>` : ''}
                </div>
                <div class="form-group">
                  <label>Estado Operativo</label>
                  <select id="eq-status" class="form-control">
                    <option value="Operativo" ${isEdit && itemToEdit.status === 'Operativo' ? 'selected' : ''}>Operativo</option>
                    <option value="En Mantenimiento" ${isEdit && itemToEdit.status === 'En Mantenimiento' ? 'selected' : ''}>En Mantenimiento</option>
                    <option value="Fuera de Servicio" ${isEdit && itemToEdit.status === 'Fuera de Servicio' ? 'selected' : ''}>Fuera de Servicio</option>
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Fecha de Último Servicio</label>
                  <input type="date" id="eq-last-date" class="form-control" value="${isEdit && itemToEdit.lastServiceDate ? itemToEdit.lastServiceDate : ''}" required />
                </div>
                <div class="form-group">
                  <label>Detalle del Último Servicio</label>
                  <input type="text" id="eq-last-details" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.lastServiceDetails || '') : ''}" required placeholder="Ej: Cambio de aceite" />
                </div>
              </div>

              <div class="form-group" style="border: 1px solid #ddd; padding: 10px; border-radius: 6px; margin-top: 10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                  <label style="margin:0;">Bitácora de Novedades (Trazabilidad)</label>
                  <button type="button" class="btn btn-primary" id="btn-add-note" style="padding: 4px 8px; font-size: 0.8rem;">➕ Añadir Novedad</button>
                </div>
                <div id="notes-history-container" style="max-height: 200px; overflow-y:auto; border:1px solid #eee; border-radius:4px;">
                  ${renderNotesHistory()}
                </div>
                <textarea id="eq-notes" style="display:none;">${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.notes || '') : ''}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancelar (Esc)</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Registrar Equipo'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modal-equipment');
    
    // Función de cierre y limpieza de listeners
    const closeModal = () => {
      document.removeEventListener('keydown', handleEsc);
      modal.remove();
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    
    document.addEventListener('keydown', handleEsc);
    
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    // Eventos de Trazabilidad - Novedades
    document.getElementById('btn-add-note').addEventListener('click', () => {
      const text = prompt('Ingrese el texto de la nueva novedad/avance:');
      if (text && text.trim() !== '') {
        notesHistory.unshift({
          id: window.AppHelpers.generateUUID(),
          text: text.trim(),
          author: window.AppStore.getState().user.name,
          date: window.AppHelpers.formatDateTime12h(new Date().toISOString())
        });
        document.getElementById('notes-history-container').innerHTML = renderNotesHistory();
        attachNoteDeleteEvents();
      }
    });

    const attachNoteDeleteEvents = () => {
      document.querySelectorAll('.btn-delete-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if(confirm('¿Seguro que desea eliminar esta novedad?')) {
            const id = e.currentTarget.getAttribute('data-id');
            const idx = notesHistory.findIndex(n => n.id === id);
            if(idx > -1) notesHistory.splice(idx, 1);
            document.getElementById('notes-history-container').innerHTML = renderNotesHistory();
            attachNoteDeleteEvents();
          }
        });
      });
    };
    attachNoteDeleteEvents();

    // Eventos de Trazabilidad - Horómetro
    const btnUpdateHour = document.getElementById('btn-update-hour');
    if (btnUpdateHour) {
      btnUpdateHour.addEventListener('click', () => {
        const inputHour = document.getElementById('eq-hour');
        const currentHour = parseInt(inputHour.value) || 0;
        const newHourStr = prompt(`Horómetro actual: ${currentHour}.\\nIngrese el nuevo valor del horómetro:`);
        if (newHourStr !== null) {
          const newHour = parseInt(newHourStr);
          if (!isNaN(newHour) && newHour >= currentHour) {
            inputHour.value = newHour;
            hourHistory.unshift({
              value: newHour,
              date: window.AppHelpers.formatDateTime12h(new Date().toISOString())
            });
            document.getElementById('hour-history-container').innerHTML = renderHourHistory();
          } else {
            alert('El valor ingresado no es válido o es menor al actual.');
          }
        }
      });
    }

    document.getElementById('form-equipment').addEventListener('submit', (e) => {
      e.preventDefault();
      const state = window.AppStore.getState();
      const currentInv = state.inventario || [];
      const statusVal = document.getElementById('eq-status').value;

      // Si es un nuevo equipo y le asignan notas en el textarea oculto, lo pasamos (aunque para nuevos no se suele usar mucho)
      let finalNotes = document.getElementById('eq-notes').value.trim();
      if(isEdit) {
        finalNotes = notesHistory.length > 0 ? notesHistory[0].text : '';
      }

      const newItem = {
        id: isEdit ? itemToEdit.id : window.AppHelpers.generateUUID(),
        equipment: document.getElementById('eq-name').value.trim(),
        brand: document.getElementById('eq-brand').value.trim(),
        model: document.getElementById('eq-model').value.trim(),
        serial: document.getElementById('eq-serial').value.trim(),
        plate: document.getElementById('eq-plate').value.trim(),
        municipality: document.getElementById('eq-mpio').value.trim(),
        location: document.getElementById('eq-loc').value.trim(),
        hourMeter: parseInt(document.getElementById('eq-hour').value) || 0,
        status: statusVal,
        lastServiceDate: document.getElementById('eq-last-date').value,
        lastServiceDetails: document.getElementById('eq-last-details').value.trim(),
        notes: finalNotes,
        hourHistory: isEdit ? hourHistory : [{ value: parseInt(document.getElementById('eq-hour').value) || 0, date: window.AppHelpers.formatDateTime12h(new Date().toISOString()) }],
        notesHistory: notesHistory,
        inoperativeDate: (isEdit && itemToEdit.status === statusVal) ? itemToEdit.inoperativeDate : 
                         ((statusVal === 'Fuera de Servicio' || statusVal === 'En Mantenimiento') ? new Date().toISOString() : null)
      };

      let updated;
      if (isEdit) {
        updated = currentInv.map(i => i.id === itemToEdit.id ? newItem : i);
      } else {
        updated = [newItem, ...currentInv];
      }

      window.AppStore.updateState('inventario', updated);
      closeModal();
      const mainContainer = document.getElementById('app-main');
      window.AppModules.inventario(mainContainer);
    });
  }

  function generatePDFReport(inventory) {
    const kpis = window.AppStore.getCalculatedKPIs();
    const dateStr = window.AppHelpers.getFormattedCurrentDate();
    
    const now = new Date();
    const pad = num => String(num).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const reportTitle = `INFORME_${timestamp}`;
    
    const logoGober = 'img/logogober.png';
    const logoRentan = 'img/logorentan.png';
    const firma = 'img/firmaalexgomez.png';

    let printHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .header-img {
            height: 70px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            flex-grow: 1;
          }
          .header-text h2 { margin: 0; color: #1e3a8a; font-size: 18px; }
          .header-text h3 { margin: 4px 0; font-size: 14px; font-weight: normal; }
          .header-text h4 { margin: 0; font-size: 12px; font-weight: normal; }
          .date-text { text-align: right; margin-bottom: 20px; font-size: 12px; }
          h1 { text-align: center; color: #1e3a8a; font-size: 18px; margin-bottom: 20px; }
          h3.section-title { border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 15px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: left; }
          th, td { border: 1px solid #ddd; padding: 6px; }
          th { background-color: #f1f5f9; }
          p.analysis { font-size: 13px; text-align: justify; margin-bottom: 30px; line-height: 1.5; }
          .signature-box { margin-top: 50px; page-break-inside: avoid; }
          .signature-img { width: 300px; max-height: 180px; object-fit: contain; margin-bottom: 0px; display: block; }
          .signature-text { border-top: 1px solid #000; width: 250px; padding-top: 5px; }
          .signature-text p { margin: 0; font-size: 12px; }
          .signature-text p.bold { font-weight: bold; font-size: 13px; }
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img src="${logoGober}" class="header-img" onerror="this.style.display='none';" />
          <div class="header-text">
            <h2>GOBERNACIÓN DE ANTIOQUIA</h2>
            <h3>Secretaría de Infraestructura Física</h3>
            <h4>Dirección de Desarrollo Físico</h4>
          </div>
          <img src="${logoRentan}" class="header-img" onerror="this.style.display='none';" />
        </div>
        
        <div class="date-text">
          <p><strong>Fecha:</strong> ${dateStr}</p>
        </div>
        
        <h1>INFORME OPERATIVO DE MAQUINARIA PESADA</h1>
        
        <h3 class="section-title">1. Resumen de Estado Operativo</h3>
        <table>
          <tr>
            <td><strong>Total Equipos:</strong> ${kpis.totalEquip}</td>
            <td><strong>Operativos:</strong> ${kpis.opEquip}</td>
            <td><strong>Inoperativos:</strong> ${kpis.maintEquip + kpis.outEquip}</td>
            <td><strong>Disponibilidad:</strong> ${kpis.availabilityPct}%</td>
          </tr>
        </table>

        <h3 class="section-title">2. Detalle de Maquinaria</h3>
        <table>
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Serie/Placa</th>
              <th>Ubicación Específica / Frente de Obra</th>
              <th>Horómetro</th>
              <th>Estado</th>
              <th>Notas / Falla</th>
            </tr>
          </thead>
          <tbody>
            ${inventory.map(item => {
              const isKm = item.equipment.toLowerCase().includes('volqueta') || item.equipment.toLowerCase().includes('camabaja');
              const unit = isKm ? 'km' : 'hrs';

              let inactivityAlert = '';
              if ((item.status === 'Fuera de Servicio' || item.status === 'En Mantenimiento') && item.inoperativeDate) {
                const inopDate = new Date(item.inoperativeDate);
                const diffDays = Math.ceil((new Date() - inopDate) / (1000 * 60 * 60 * 24));
                let color = '#dc2626'; // roja
                let width = '100%';
                if (diffDays < 30) {
                  color = '#f97316'; // naranja claro
                  width = '33%';
                } else if (diffDays <= 60) {
                  color = '#ea580c'; // naranja oscuro
                  width = '66%';
                }
                
                inactivityAlert = `
                  <div style="margin-top: 6px; background: #e2e8f0; border-radius: 4px; height: 6px; width: 100%; overflow: hidden;" title="${diffDays} días inoperativo">
                    <div style="background: ${color}; height: 100%; width: ${width};"></div>
                  </div>
                  <div style="font-size: 0.7rem; text-align: center; color: #666; margin-top: 2px;">
                    ${diffDays} días inoperativo
                  </div>
                `;
              }

              return `
              <tr>
                <td>${window.AppHelpers.escapeHTML(item.equipment)}</td>
                <td>${window.AppHelpers.escapeHTML(item.serial)}</td>
                <td>${window.AppHelpers.escapeHTML(item.municipality)} - ${window.AppHelpers.escapeHTML(item.location)}</td>
                <td style="white-space: nowrap;">${item.hourMeter.toLocaleString('es-CO')} ${unit}</td>
                <td style="font-weight: ${item.status === 'Operativo' ? 'normal' : 'bold'}; color: ${item.status === 'Operativo' ? 'black' : '#dc2626'}; width: 120px;">
                  ${window.AppHelpers.escapeHTML(item.status)}
                  ${inactivityAlert}
                </td>
                <td>${window.AppHelpers.escapeHTML(item.notes || '-')}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h3 class="section-title">3. Análisis y Recomendaciones</h3>
        <p class="analysis">
          De acuerdo con el estado actual del inventario consolidado en el sistema, se observa una disponibilidad global de la flota del <strong>${kpis.availabilityPct}%</strong>.
          Se recomienda priorizar los mantenimientos preventivos y correctivos de los equipos inoperativos para evitar retrasos en los frentes de obra, y así incrementar la disponibilidad operativa. Es fundamental agilizar la gestión de repuestos con los proveedores externos, de acuerdo con las fallas documentadas en el presente reporte.
        </p>

        <div class="signature-box">
          <img src="${firma}" class="signature-img" onerror="this.style.display='none';" />
        </div>
      </body>
      </html>
    `;

    // Abrir una nueva ventana de impresión y enviar el HTML
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para ver el informe.");
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Esperar a que las imágenes carguen antes de invocar la impresión
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
})();
