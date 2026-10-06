/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Tarjeta de un frente activo
 */

window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;

  F.renderFrenteCard = function renderFrenteCard(frente) {
    const eqPropios = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isGob);
    const eqRentan = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isRentan);
    const eqAlquilados = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isAlquilado);
    const eqSinClasificar = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isSinClasificar);

    const actType = frente.activityType || 'Emergencias Viales';
    const actIconSrc = window.AppHelpers.getActivityIcon(actType);
    const actColor = actType === 'Emergencias Viales' ? '#dc2626' : '#ca8a04';

    // Agrupar equipos por nombre para los iconos superiores
    const eqGroups = {};
    frente.equipment.forEach(e => {
        const type = window.AppHelpers.escapeHTML(e.type);
        if(!eqGroups[type]) eqGroups[type] = 0;
        eqGroups[type]++;
    });
    
    let eqSummaryHtml = '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top: 10px; margin-bottom: 5px;">';
    for(const [type, count] of Object.entries(eqGroups)) {
        eqSummaryHtml += `
            <div style="display:flex; align-items:center; background:var(--bg-subtle); padding:3px 6px; border-radius:4px; border:1px solid var(--card-border);" title="${type}">
                ${window.AppHelpers.getEquipmentIcon(type, 18)} 
                <span style="font-weight:bold; font-size:0.8rem; color: var(--text-heading);">x${count}</span>
            </div>
        `;
    }
    eqSummaryHtml += '</div>';

    return `
      <div class="card" style="display: flex; flex-direction: column; box-shadow: var(--shadow-md);">
        <div style="border-bottom: 2px solid var(--card-border); padding-bottom: 10px; margin-bottom: 10px;">
          <!-- Badge de Actividad -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <div style="display:flex; align-items:center; background:${actColor}15; color:${actColor}; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.75rem; text-transform:uppercase;">
                <img src="${actIconSrc}" style="width:16px; height:16px; margin-right:6px; object-fit:contain;" alt="${window.AppHelpers.escapeHTML(actType)}">
                ${window.AppHelpers.escapeHTML(actType)}
            </div>
            <span style="background: var(--bg-subtle); color: var(--text-secondary); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
              ${window.AppHelpers.escapeHTML(frente.date || window.AppHelpers.getFormattedCurrentDate())}
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 style="margin: 0; color: var(--text-heading); font-size: 1.1rem; line-height: 1.2;">
              📍 ${window.AppHelpers.escapeHTML(frente.municipality)}
            </h3>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:-2px; margin-bottom:8px; font-weight:600; text-transform:uppercase;">
            🌎 Subregión: <span style="color: var(--text-heading);">${window.AppHelpers.escapeHTML(frente.subregion || 'Desconocida')}</span>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px; font-weight: 500;">
            ${window.AppHelpers.escapeHTML(frente.name)}
          </div>
          
          ${eqSummaryHtml}
          
          ${frente.metadata && (frente.metadata.estadoVia || frente.metadata.avance || frente.metadata.avanceActual !== undefined || frente.metadata.longitud || frente.metadata.km) ? `
          <div style="background: var(--bg-subtle); border-radius: 4px; padding: 8px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
            ${frente.metadata.estadoVia ? `<div style="margin-bottom:4px;"><strong>🛣️ Estado:</strong> ${window.AppHelpers.escapeHTML(frente.metadata.estadoVia)}</div>` : ''}
            ${(() => {
                const { act: actVal, ant: antVal, delta: deltaVal } = F.getAvance(frente);
                const deltaClass = deltaVal > 0 ? 'badge-delta-pos' : (deltaVal < 0 ? 'badge-delta-neg' : 'badge-delta-zero');
                const deltaSign = deltaVal > 0 ? '+' : '';
                return `
                  <div style="margin-top:4px; margin-bottom:6px; background:var(--card-bg); border:1px solid var(--card-border); border-radius:6px; padding:6px 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <strong style="color: var(--text-heading);">📈 Avance: <span style="font-size:0.9rem;">${actVal}%</span></strong>
                      <span class="badge-delta ${deltaClass}">${deltaSign}${deltaVal}% sem.</span>
                    </div>
                    <div class="progress-container" style="height:12px; margin-bottom:3px;">
                      <div class="progress-dual">
                        <div class="progress-prev" style="width: ${Math.min(antVal, actVal)}%;" title="Semana Anterior: ${antVal}%"></div>
                        <div class="progress-delta" style="width: ${Math.max(0, actVal - antVal)}%;" title="Incremento Semanal: +${deltaVal}%"></div>
                      </div>
                      <div class="progress-text" style="line-height:12px;">${actVal}%</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-secondary);">
                      <span>Sem. Anterior: <strong>${antVal}%</strong></span>
                      <span>Variación: <strong>${deltaSign}${deltaVal}%</strong></span>
                    </div>
                  </div>
                `;
            })()}
            ${frente.metadata.longitud ? `<div style="margin-bottom:2px;"><strong>📏 Longitud:</strong> ${window.AppHelpers.escapeHTML(frente.metadata.longitud)}</div>` : ''}
            ${frente.metadata.km ? `<div><strong>📍 Km Atención:</strong> ${window.AppHelpers.escapeHTML(frente.metadata.km)}</div>` : ''}
          </div>
          ` : ''}
        </div>

        <div style="flex-grow: 1;">
          <div style="display:flex; justify-content:space-between; font-size: 0.75rem; font-weight: bold; margin-bottom: 8px; color: var(--text-muted);">
            <span>TOTAL EQUIPOS: ${frente.equipment.length}</span>
            <span>
              ${eqPropios.length > 0 ? `<span style="color: var(--primary-green);">${eqPropios.length} GOB</span>` : ''} 
              ${eqPropios.length > 0 && (eqRentan.length > 0 || eqAlquilados.length > 0) ? ' | ' : ''}
              ${eqRentan.length > 0 ? `<span style="color: var(--status-info);">${eqRentan.length} RNT</span>` : ''}
              ${eqRentan.length > 0 && eqAlquilados.length > 0 ? ' | ' : ''}
              ${eqAlquilados.length > 0 ? `<span style="color: #f59e0b;">${eqAlquilados.length} ALQ</span>` : ''}
              ${eqSinClasificar.length > 0 ? ` | <span style="color: var(--text-secondary);" title="Equipos sin marca de propietario en el Excel">${eqSinClasificar.length} SIN CLASIFICAR</span>` : ''}
            </span>
          </div>

          <ul style="list-style: none; padding: 0; margin: 0; display:flex; flex-direction:column; gap:6px;">
            ${frente.equipment.map(eq => {
              const ownerInfo = window.AppHelpers.getEquipmentOwnerInfo(eq.owner);

              return `
                <li style="display:flex; justify-content:space-between; align-items:center; background: var(--card-bg); padding: 6px 8px; border-radius: 4px; border-left: 3px solid ${ownerInfo.color}; border: 1px solid var(--card-border);">
                  <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <span style="font-size: 0.75rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-heading);" title="${window.AppHelpers.escapeHTML(eq.type)}">
                      ${window.AppHelpers.getEquipmentIcon(eq.type)} ${window.AppHelpers.escapeHTML(eq.type)}
                    </span>
                    <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">Placa/Id: ${window.AppHelpers.escapeHTML(eq.plate || 'N/A')}</span>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span style="font-size: 0.65rem; background: ${ownerInfo.color}; color: white; padding: 2px 4px; border-radius: 3px; font-weight:bold;">
                      ${ownerInfo.key}
                    </span>
                    <span style="font-size: 0.65rem; margin-top:2px; color: ${String(eq.status || '').toLowerCase().includes('operativo') ? 'var(--status-success)' : 'var(--status-danger)'};">
                      ${window.AppHelpers.escapeHTML(eq.status)}
                    </span>
                  </div>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      </div>
    `;
  }
})();
