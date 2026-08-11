/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 1: Inicio (Centro de Control Operativo y Dashboard Unificado)
 */

window.AppModules = window.AppModules || {};

window.AppModules.inicio = function renderInicioModule(container) {
  const state = window.AppStore.getState();
  const kpis = window.AppStore.getCalculatedKPIs();
  const currentDateStr = window.AppHelpers.getFormattedCurrentDate();
  const weekNum = window.AppHelpers.getISOWeekNumber();
  const remainingDays = window.AppHelpers.getRemainingDaysInMonth();
  const alerts = window.AppAlerts.getSystemAlerts();

  // Mantenimientos
  const todayMts = (state.mantenimientos || []).filter(t => t.estado !== 'Completado');
  // Informes pendientes
  const pendingReports = (state.informes || []).filter(i => i.status === 'Pendiente' || i.status === 'En Revisión');

  // Análisis Inteligente
  let aiCardStyle = 'border-left: 4px solid var(--primary-green); background: var(--status-success-bg);';
  let aiTitle = '🏆 Felicitaciones';
  let aiMessage = 'La disponibilidad de la flota y el estado operativo se mantienen en óptimas condiciones.';
  
  if (kpis.availabilityPct < 80) {
    aiCardStyle = 'border-left: 4px solid var(--status-danger); background: var(--status-danger-bg);';
    aiTitle = '🚨 Alerta de Productividad';
    aiMessage = 'La disponibilidad de la maquinaria está por debajo del 80%. Se sugiere priorizar órdenes de trabajo de mantenimiento correctivo de forma urgente para los equipos inoperativos.';
  } else if (kpis.maintEquip > 3) {
    aiCardStyle = 'border-left: 4px solid var(--status-warning); background: var(--status-warning-bg);';
    aiTitle = '⚠️ Recomendación de Mejora Continua';
    aiMessage = 'Alta concentración de equipos en taller. Se recomienda revisar los tiempos de respuesta del proveedor de repuestos para acelerar los mantenimientos preventivos.';
  }

  container.innerHTML = `
    <div class="fade-in">
      <!-- Banner Principal Institucional -->
      <div class="home-hero">
        <div>
          <h2>Secretaría de Infraestructura Física</h2>
          <p>Dirección de Desarrollo Físico — Torre de Control Operativo Unificada</p>
          <div style="margin-top: 0.75rem; font-size: 0.9rem; opacity: 0.95;">
            🗓️ <strong>${currentDateStr}</strong> | Semana ISO N° <strong>${weekNum}</strong>
          </div>
        </div>
        <div class="clock-display">
          <div class="clock-time" id="realtime-clock">--:--:--</div>
          <div class="clock-date">${remainingDays} días restantes en el mes</div>
        </div>
      </div>

      <!-- Tarjeta de Análisis Inteligente -->
      <div class="card" style="margin-top: 1.5rem; ${aiCardStyle}">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="font-size: 2rem;">💡</div>
          <div>
            <h3 style="margin-bottom: 0.25rem; font-weight: bold;">${aiTitle}</h3>
            <p style="font-size: 0.95rem;">${aiMessage}</p>
          </div>
        </div>
      </div>

      <!-- Resumen Ejecutivo Transversal (KPIs) -->
      <div class="kpi-grid" style="margin-top: 1.5rem;">
        <div class="kpi-card" style="border-left: 4px solid var(--status-success); cursor: pointer;" onclick="window.navigateToModule('inventario')">
          <div class="kpi-icon" style="background-color: var(--status-success-bg); color: var(--status-success);">🚜</div>
          <div class="kpi-details">
            <div class="kpi-value">${kpis.availabilityPct}%</div>
            <div class="kpi-label">Disponibilidad (${kpis.opEquip}/${kpis.totalEquip})</div>
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid var(--status-warning); cursor: pointer;" onclick="window.navigateToModule('mantenimientos')">
          <div class="kpi-icon" style="background-color: var(--status-warning-bg); color: var(--status-warning);">🛠️</div>
          <div class="kpi-details">
            <div class="kpi-value">${kpis.maintEquip + kpis.outEquip}</div>
            <div class="kpi-label">Equipos en Taller/Inoperativos</div>
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid var(--primary-green); cursor: pointer;" onclick="window.navigateToModule('mantenimientos')">
          <div class="kpi-icon" style="background-color: var(--primary-subtle); color: var(--primary-green);">☑️</div>
          <div class="kpi-details">
            <div class="kpi-value">${kpis.mtCompliancePct}%</div>
            <div class="kpi-label">Mantenimientos Cumplidos</div>
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid var(--status-info); cursor: pointer;" onclick="window.navigateToModule('informes')">
          <div class="kpi-icon" style="background-color: #dbeafe; color: var(--status-info);">📊</div>
          <div class="kpi-details">
            <div class="kpi-value">${pendingReports.length}</div>
            <div class="kpi-label">Informes en Flujo</div>
          </div>
        </div>
      </div>

      <!-- Gráficos Nativo en HTML5 Canvas (Heredado del Dashboard) -->
      <div class="charts-grid" style="margin-top: 1.5rem;">
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">📈 Estado Operativo de la Flota</div>
          </div>
          <div class="canvas-container">
            <canvas id="chart-equipment-status"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">🏙️ Distribución por Municipio</div>
          </div>
          <div class="canvas-container">
            <canvas id="chart-equipment-municipality"></canvas>
          </div>
        </div>
      </div>

      <!-- Grid de Paneles Integrados (Mantenimientos e Informes) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
        
        <!-- Panel 1: Órdenes de Mantenimiento Pendientes -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🛠️ Órdenes de Mantenimiento Activas</div>
            <button class="btn btn-secondary btn-icon" onclick="window.navigateToModule('mantenimientos')">Gestionar</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${todayMts.length === 0 ? '<p style="color: var(--text-muted);">Sin mantenimientos en proceso.</p>' : ''}
            ${todayMts.slice(0, 4).map(t => `
              <div style="padding: 0.75rem; background: var(--bg-light); border-radius: var(--radius-md); border-left: 4px solid ${t.tipo === 'Correctivo' ? 'var(--status-danger)' : 'var(--status-warning)'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.9rem;">${window.AppHelpers.escapeHTML(t.descripcion)}</strong>
                  <span class="badge ${t.tipo === 'Correctivo' ? 'badge-danger' : 'badge-warning'}">${t.tipo}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                  Responsable: ${window.AppHelpers.escapeHTML(t.responsable)} | Fecha: <strong>${t.fecha}</strong>
                </div>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  ${t.equipoId ? window.AppComponents.renderEntityLink('equipment', t.equipoId) : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Panel 2: Informes en Flujo de Aprobación -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📊 Flujo de Aprobación de Informes</div>
            <button class="btn btn-secondary btn-icon" onclick="window.navigateToModule('informes')">Ver Todos</button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Informe</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${pendingReports.length === 0 ? '<tr><td colspan="3" style="text-align:center;">No hay informes pendientes.</td></tr>' : ''}
                ${pendingReports.map(inf => `
                  <tr>
                    <td><strong>${window.AppHelpers.escapeHTML(inf.titulo)}</strong></td>
                    <td>📅 ${inf.fechaLimite}</td>
                    <td>
                      <span class="badge ${inf.status === 'En Revisión' ? 'badge-warning' : 'badge-danger'}">
                        ${inf.status}
                      </span>
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

  startClock();

  // Render Charts
  setTimeout(() => {
    window.AppCanvasCharts.renderDonutChart(
      'chart-equipment-status',
      ['Operativos', 'En Mantenimiento', 'Fuera de Servicio'],
      [kpis.opEquip, kpis.maintEquip, kpis.outEquip],
      ['#16a34a', '#d97706', '#dc2626']
    );

    const mpioCounts = {};
    (state.inventario || []).forEach(eq => {
      mpioCounts[eq.municipality] = (mpioCounts[eq.municipality] || 0) + 1;
    });

    const mpioLabels = Object.keys(mpioCounts).slice(0, 6);
    const mpioValues = mpioLabels.map(k => mpioCounts[k]);

    window.AppCanvasCharts.renderBarChart(
      'chart-equipment-municipality',
      mpioLabels,
      mpioValues,
      '#006837'
    );
  }, 50);
};

function startClock() {
  const update = () => {
    const el = document.getElementById('realtime-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('es-CO');
  };
  update();
  // Store interval globally if we want to clear it later, or just let it run
  if (!window.AppClockInterval) {
    window.AppClockInterval = setInterval(update, 1000);
  }
}
