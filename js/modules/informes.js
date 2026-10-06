/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 10: Informes con Automatización de Flujos de Aprobación y Generador Automático
 */

window.AppModules = window.AppModules || {};

window.AppModules.informes = function renderInformesModule(container) {
  const state = window.AppStore.getState();
  const reports = state.informes || [];
  const actasGeneradas = state.actasGeneradas || [];

  container.innerHTML = `
    <div class="fade-in" style="padding-bottom: 4rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-heading);">Gestión y Generación de Informes</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Recepción, revisión técnica, aprobación y generación automática de actas formales.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" id="btn-generate-acta" style="font-size: 1.1rem; padding: 10px 20px;">
            📝 Redactar y Generar Acta
          </button>
          <button class="btn btn-secondary" id="btn-add-report">
            📊 Registrar Flujo
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 15px; margin-bottom: 1rem; border-bottom: 2px solid var(--border-light);">
        <button id="tab-flujo" class="tab-btn active" style="padding: 10px 15px; background: none; border: none; font-weight: bold; color: var(--text-heading); border-bottom: 3px solid var(--primary-dark); cursor: pointer;">
          Flujo de Informes (${reports.length})
        </button>
        <button id="tab-generados" class="tab-btn" style="padding: 10px 15px; background: none; border: none; font-weight: bold; color: var(--text-secondary); border-bottom: 3px solid transparent; cursor: pointer;">
          Actas e Informes Generados (${actasGeneradas.length})
        </button>
      </div>

      <!-- TAB 1: Flujo -->
      <div id="content-flujo" class="tab-content active" style="display: block;">
        <div class="card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Título del Informe</th>
                  <th>Tipo</th>
                  <th>Periodo</th>
                  <th>Fecha Límite</th>
                  <th>Estado del Flujo</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${reports.length === 0 ? `
                  <tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 2rem;">No hay informes en el flujo.</td></tr>
                ` : reports.map(r => `
                  <tr>
                    <td><strong>${window.AppHelpers.escapeHTML(r.titulo)}</strong></td>
                    <td><span class="badge ${r.tipo === 'Mensual' ? 'badge-info' : 'badge-neutral'}">${window.AppHelpers.escapeHTML(r.tipo)}</span></td>
                    <td>${window.AppHelpers.escapeHTML(r.periodo)}</td>
                    <td>${window.AppHelpers.escapeHTML(r.fechaLimite || '-')}</td>
                    <td>
                      <span class="badge ${r.status === 'Aprobado' || r.status === 'Entregado' ? 'badge-success' : r.status === 'En Revisión' ? 'badge-warning' : 'badge-danger'}">
                        ${window.AppHelpers.escapeHTML(r.status)}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      ${r.status !== 'Aprobado' ? `
                        <button class="btn btn-success btn-icon btn-approve-workflow" data-id="${r.id}" title="Aprobar y Ejecutar Flujo">✅ Aprobar</button>
                      ` : `
                        <span class="badge badge-success">Archivado</span>
                      `}
                      <button class="btn btn-secondary btn-icon btn-edit-report" data-id="${r.id}" title="Editar">✏️</button>
                      <button class="btn btn-danger btn-icon btn-delete-report" data-id="${r.id}" title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: Generados -->
      <div id="content-generados" class="tab-content" style="display: none;">
        <div class="card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asunto del Acta/Informe</th>
                  <th>Tipo</th>
                  <th>Fecha y Hora</th>
                  <th>Responsable</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${actasGeneradas.length === 0 ? `
                  <tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 2rem;">No hay actas generadas aún. Usa el botón "Generador Automático de Actas".</td></tr>
                ` : actasGeneradas.map(a => `
                  <tr>
                    <td><strong>${window.AppHelpers.escapeHTML(a.asunto)}</strong></td>
                    <td><span class="badge badge-info">${window.AppHelpers.escapeHTML(a.tipo)}</span></td>
                    <td>${window.AppHelpers.escapeHTML(a.fecha)} - ${window.AppHelpers.escapeHTML(a.hora)}</td>
                    <td>${window.AppHelpers.escapeHTML(a.responsable)}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-primary btn-icon btn-print-acta" data-id="${a.id}" title="Reimprimir PDF">🖨️ PDF</button>
                      <button class="btn btn-danger btn-icon btn-delete-acta" data-id="${a.id}" title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tab Switching Logic
  const tabFlujo = container.querySelector('#tab-flujo');
  const tabGenerados = container.querySelector('#tab-generados');
  const contentFlujo = container.querySelector('#content-flujo');
  const contentGenerados = container.querySelector('#content-generados');

  tabFlujo.addEventListener('click', () => {
    tabFlujo.style.borderBottomColor = 'var(--primary-dark)';
    tabFlujo.style.color = 'var(--text-heading)';
    tabGenerados.style.borderBottomColor = 'transparent';
    tabGenerados.style.color = 'var(--text-secondary)';
    contentFlujo.style.display = 'block';
    contentGenerados.style.display = 'none';
  });

  tabGenerados.addEventListener('click', () => {
    tabGenerados.style.borderBottomColor = 'var(--primary-dark)';
    tabGenerados.style.color = 'var(--text-heading)';
    tabFlujo.style.borderBottomColor = 'transparent';
    tabFlujo.style.color = 'var(--text-secondary)';
    contentGenerados.style.display = 'block';
    contentFlujo.style.display = 'none';
  });

  // Flow Tracking Actions
  container.querySelectorAll('.btn-approve-workflow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = reports.find(r => r.id === id);
      if (!item) return;

      if (confirm(`¿Marcar el informe "${item.titulo}" como Aprobado?`)) {
        const updatedReports = reports.map(r => r.id === id ? { ...r, status: 'Aprobado', fechaAprobacion: window.AppHelpers.todayISO() } : r);
        window.AppStore.updateState('informes', updatedReports, 'ReportApproved');
        window.AppHelpers.toast('Informe aprobado', 'El indicador de informes del Inicio se actualizó. Las obligaciones se actualizan manualmente.', 'info', 5000);
      }
    });
  });

  document.getElementById('btn-add-report').addEventListener('click', () => openReportModal());
  document.getElementById('btn-generate-acta').addEventListener('click', () => openActaGeneratorModal());

  container.querySelectorAll('.btn-edit-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = reports.find(r => r.id === id);
      if (item) openReportModal(item);
    });
  });

  container.querySelectorAll('.btn-delete-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Desea eliminar este registro del flujo?')) {
        const updated = reports.filter(r => r.id !== id);
        window.AppStore.updateState('informes', updated);
      }
    });
  });

  // Generated Actas Actions
  container.querySelectorAll('.btn-print-acta').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const acta = actasGeneradas.find(a => a.id === id);
      if (acta) generateActaPDF(acta);
    });
  });

  container.querySelectorAll('.btn-delete-acta').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Desea eliminar esta acta generada permanentemente?')) {
        const updated = actasGeneradas.filter(a => a.id !== id);
        window.AppStore.updateState('actasGeneradas', updated);
      }
    });
  });
};

// -------------------------------------------------------------
// FLUJO DE INFORMES MODAL
// -------------------------------------------------------------
function openReportModal(itemToEdit = null) {
  const isEdit = !!itemToEdit;

  const modalHTML = `
    <div class="modal-overlay active" id="modal-report">
      <form id="form-report" class="modal-content" style="background: var(--card-bg);">
        <div class="modal-header">
          <div class="modal-title">${isEdit ? '✏️ Editar Registro de Informe' : '📊 Registrar Nuevo Flujo de Informe'}</div>
          <button type="button" class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body" style="background: var(--card-bg);">
            <div class="form-group">
              <label>Título del Informe</label>
              <input type="text" id="rep-title" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.titulo) : ''}" required />
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Tipo de Informe</label>
                <select id="rep-type" class="form-control">
                  <option value="Semanal" ${isEdit && itemToEdit.tipo === 'Semanal' ? 'selected' : ''}>Semanal</option>
                  <option value="Mensual" ${isEdit && itemToEdit.tipo === 'Mensual' ? 'selected' : ''}>Mensual</option>
                </select>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Periodo Cubierto</label>
                <input type="text" id="rep-period" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.periodo) : ''}" required />
              </div>
              <div class="form-group">
                <label>Fecha Límite</label>
                <input type="date" id="rep-due-date" class="form-control" value="${isEdit ? window.AppHelpers.escapeHTML(itemToEdit.fechaLimite || '') : window.AppHelpers.todayISO()}" required />
              </div>
            </div>
            <div class="form-group">
              <label>Estado Inicial en el Flujo</label>
              <select id="rep-status" class="form-control">
                <option value="Pendiente" ${isEdit && itemToEdit.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="En Revisión" ${isEdit && itemToEdit.status === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
                <option value="Aprobado" ${isEdit && itemToEdit.status === 'Aprobado' ? 'selected' : ''}>Aprobado</option>
              </select>
            </div>
          </div>
          <div class="modal-footer" style="background: var(--card-bg);">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Registrar Informe'}</button>
          </div>
      </form>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('modal-report');
  const closeModal = () => modal.remove();

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

  document.getElementById('form-report').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentReports = window.AppStore.getState().informes || [];

    const newItem = {
      ...(isEdit ? itemToEdit : {}),
      id: isEdit ? itemToEdit.id : window.AppHelpers.generateUUID(),
      titulo: document.getElementById('rep-title').value.trim(),
      tipo: document.getElementById('rep-type').value,
      periodo: document.getElementById('rep-period').value.trim(),
      fechaLimite: document.getElementById('rep-due-date').value,
      status: document.getElementById('rep-status').value,
      responsable: isEdit && itemToEdit.responsable ? itemToEdit.responsable : window.AppHelpers.getUserName()
    };

    let updated = isEdit ? currentReports.map(r => r.id === itemToEdit.id ? newItem : r) : [newItem, ...currentReports];
    closeModal();
    window.AppStore.updateState('informes', updated, 'ReportSubmitted');
  });
}

// -------------------------------------------------------------
// GENERADOR AUTOMÁTICO DE ACTAS MODAL
// -------------------------------------------------------------
function openActaGeneratorModal() {
  const now = new Date();
  const currentDate = window.AppHelpers.todayISO(now);
  const currentTime = window.AppHelpers.nowTime(now);

  const modalHTML = `
    <div class="modal-overlay active" id="modal-acta">
      <form id="form-acta" class="modal-content" style="max-width: 800px; background: var(--card-bg);">
        <div class="modal-header">
          <div class="modal-title">📝 Redactar y Generar Acta (Con Membretes)</div>
          <button type="button" class="modal-close" id="modal-close-acta">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto; background: var(--card-bg);">
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
              Llena los metadatos y pega el texto plano de tus notas de reunión. El sistema le dará formato oficial con membretes y firmas.
            </p>
            
            <div class="form-grid">
              <div class="form-group">
                <label>Fecha del Informe</label>
                <input type="date" id="acta-fecha" class="form-control" value="${currentDate}" required />
              </div>
              <div class="form-group">
                <label>Hora</label>
                <input type="time" id="acta-hora" class="form-control" value="${currentTime}" required />
              </div>
              <div class="form-group">
                <label>Tipo de Documento</label>
                <select id="acta-tipo" class="form-control">
                  <option value="Acta de Reunión">Acta de Reunión</option>
                  <option value="Informe de Visita de Campo">Informe de Visita de Campo</option>
                  <option value="Reporte de Novedades">Reporte de Novedades</option>
                  <option value="Minuta Oficial">Minuta Oficial</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Asunto / Título</label>
              <input type="text" id="acta-asunto" class="form-control" placeholder="Ej: Seguimiento Puntos Críticos Heliconia" required />
            </div>

            <div class="form-group">
              <label>Participantes / Asistentes</label>
              <input type="text" id="acta-participantes" class="form-control" placeholder="Ej: Alexander Gómez, Interventoría, Contratista" required />
            </div>

            <div class="form-group">
              <label>Contenido del Informe (Texto Plano)</label>
              <textarea id="acta-contenido" class="form-control" rows="8" placeholder="Pega aquí los apuntes, viñetas y acuerdos de la reunión..." required style="resize: vertical; font-family: monospace;"></textarea>
            </div>


          </div>
          <div class="modal-footer" style="background: var(--card-bg);">
            <button type="button" class="btn btn-secondary" id="modal-cancel-acta">Cancelar</button>
            <button type="submit" class="btn btn-primary">📄 Generar e Imprimir Acta</button>
          </div>
      </form>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('modal-acta');
  const closeModal = () => modal.remove();

  document.getElementById('modal-close-acta').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-acta').addEventListener('click', closeModal);

  document.getElementById('form-acta').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentActas = window.AppStore.getState().actasGeneradas || [];

    const acta = {
      id: window.AppHelpers.generateUUID(),
      fecha: document.getElementById('acta-fecha').value,
      hora: document.getElementById('acta-hora').value,
      tipo: document.getElementById('acta-tipo').value,
      asunto: document.getElementById('acta-asunto').value.trim(),
      participantes: document.getElementById('acta-participantes').value.trim(),
      contenido: document.getElementById('acta-contenido').value.trim(),
      responsable: window.AppHelpers.getUserName()
    };

    const updated = [acta, ...currentActas];
    closeModal();
    window.AppStore.updateState('actasGeneradas', updated);

    // Automatically open the generated PDF view
    generateActaPDF(acta);
    // Make sure we end up on the "Generados" tab visually
    setTimeout(() => {
        document.getElementById('tab-generados').click();
    }, 50);
  });
}

// -------------------------------------------------------------
// PDF GENERATION LOGIC FOR ACTAS
// -------------------------------------------------------------
function generateActaPDF(acta) {
  const logoGober = 'img/logogober.png';
  const logoRentan = 'img/logorentan.png';
  
  // Format content paragraphs
  const paragraphs = acta.contenido.split('\n').map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '<br/>';
      // Detect bullets
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return `<li style="margin-left: 20px; margin-bottom: 5px;">${window.AppHelpers.escapeHTML(trimmed.substring(1).trim())}</li>`;
      }
      return `<p style="margin: 0 0 10px 0; text-align: justify; line-height: 1.6;">${window.AppHelpers.escapeHTML(trimmed)}</p>`;
  }).join('');

  let printHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${window.AppHelpers.escapeHTML(acta.tipo)} - ${window.AppHelpers.escapeHTML(acta.asunto)}</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          margin: 0;
          padding: 2cm;
          font-size: 11pt;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #006b3a;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header img {
          height: 60px;
          object-fit: contain;
        }
        .doc-title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #006b3a;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        .metadata-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .metadata-table td, .metadata-table th {
          border: 1px solid #ccc;
          padding: 8px 12px;
          text-align: left;
        }
        .metadata-table th {
          background-color: #f1f5f9;
          width: 25%;
          color: #334155;
          font-size: 10pt;
        }
        .metadata-table td {
          width: 75%;
          font-weight: bold;
        }
        .content-body {
          margin-bottom: 50px;
          min-height: 300px;
        }
        .signatures {
          margin-top: 80px;
          display: flex;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 50px;
        }
        .signature-block {
          width: 300px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-bottom: 8px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 8pt;
          color: #64748b;
          border-top: 1px solid #ccc;
          padding-top: 15px;
        }
        @media print {
          body { padding: 0; }
          .footer { position: fixed; bottom: 0; width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoGober}" alt="Gobernación de Antioquia" onerror="this.style.display='none'">
        <div style="text-align: center; font-size: 9pt; color: #475569;">
          <div>SECRETARÍA DE INFRAESTRUCTURA FÍSICA</div>
          <div>SISTEMA DE GESTIÓN DEL CONTRATO</div>
        </div>
        <img src="${logoRentan}" alt="Rentan" onerror="this.style.display='none'">
      </div>

      <div class="doc-title">
        ${window.AppHelpers.escapeHTML(acta.tipo)}
      </div>

      <table class="metadata-table">
        <tr>
          <th>Asunto</th>
          <td>${window.AppHelpers.escapeHTML(acta.asunto)}</td>
        </tr>
        <tr>
          <th>Fecha y Hora</th>
          <td>${window.AppHelpers.escapeHTML(acta.fecha)} | ${window.AppHelpers.escapeHTML(acta.hora)}</td>
        </tr>
        <tr>
          <th>Asistentes / Participantes</th>
          <td>${window.AppHelpers.escapeHTML(acta.participantes)}</td>
        </tr>
      </table>

      <div class="content-body">
        <h4 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; color: #334155;">DESARROLLO DEL INFORME:</h4>
        ${paragraphs}
      </div>

      <div class="signatures">
        <div class="signature-block" style="text-align: left;">
          ${window.AppHelpers.getSignatureHTML('max-height: 150px; display: block;')}
        </div>
      </div>

      <div class="footer">
        Documento generado automáticamente a través del Sistema de Gestión del Contrato. 
        Este documento es de uso oficial y confidencial de la Gobernación de Antioquia y Rentan.
      </div>

    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita las ventanas emergentes (pop-ups) en su navegador para ver el acta.');
    return;
  }
  printWindow.document.write(printHTML);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}
