/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Informe ejecutivo imprimible de frentes activos
 */

window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;

  F.generateFrentesPDF = function generateFrentesPDF(frentes) {
    const dateStr = window.AppHelpers.getFormattedCurrentDate();
    const now = new Date();
    const pad = num => String(num).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const logoGober = 'img/logogober.png';
    const logoRentan = 'img/logorentan.png';

    let totalFrentes = frentes.length;
    let totalEquipos = 0;
    let totalPropios = 0;
    let totalRentan = 0;
    let totalAlquilados = 0;
    let totalSinClasificar = 0;
    let typeStats = { 'Emergencias Viales': 0, 'Atención a Puntos Críticos': 0 };
    let subregionStats = {};
    let totalAvanceActual = 0;
    let totalAvanceAnterior = 0;
    
    frentes.forEach(f => {
      totalEquipos += f.equipment.length;
      f.equipment.forEach(eq => {
        const info = window.AppHelpers.getEquipmentOwnerInfo(eq.owner);
        if (info.isGob) totalPropios++; 
        else if (info.isRentan) totalRentan++;
        else if (info.isSinClasificar) totalSinClasificar++;
        else totalAlquilados++;
      });
      
      const activityType = f.metadata && f.metadata.activityType ? f.metadata.activityType : 'Emergencias Viales';
      if(typeStats[activityType] !== undefined) typeStats[activityType]++;
      else typeStats[activityType] = 1;
      
      const subregion = f.metadata && f.metadata.subregion && f.metadata.subregion !== 'Desconocida' ? f.metadata.subregion.toUpperCase() : 'NO ESPECIFICADA';
      if(subregionStats[subregion]) subregionStats[subregion]++;
      else subregionStats[subregion] = 1;

      const { act: actVal, ant: antVal } = F.getAvance(f);
      totalAvanceActual += actVal;
      totalAvanceAnterior += antVal;
    });
    
    // Sort subregions by count descending
    const sortedSubregions = Object.keys(subregionStats).sort((a, b) => subregionStats[b] - subregionStats[a]);

    const avgAvanceActual = totalFrentes > 0 ? Math.round(totalAvanceActual / totalFrentes) : 0;
    const avgAvanceAnterior = totalFrentes > 0 ? Math.round(totalAvanceAnterior / totalFrentes) : 0;
    const avgDeltaSemanal = avgAvanceActual - avgAvanceAnterior;

    // Top frentes con mayor avance semanal
    const topIncrementos = [...frentes].map(f => {
      const { act: actVal, ant: antVal } = F.getAvance(f);
      return {
        municipality: f.municipality,
        name: f.name,
        actVal,
        antVal,
        delta: actVal - antVal
      };
    }).filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 4);

    let printHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>FRENTES_ACTIVOS_${timestamp}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; background: white; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 15px; }
          .header-img { height: 70px; object-fit: contain; }
          .header-text { text-align: center; flex-grow: 1; }
          .header-text h2 { margin: 0; color: #1e3a8a; font-size: 18px; }
          .header-text h3 { margin: 4px 0; font-size: 14px; font-weight: normal; }
          .date-text { text-align: right; margin-bottom: 20px; font-size: 12px; }
          h1 { text-align: center; color: #1e3a8a; font-size: 18px; margin-bottom: 20px; text-transform: uppercase; }
          
          .dashboard { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
          .dash-stat { text-align: center; min-width: 100px; }
          .dash-stat h4 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; }
          .dash-stat div { font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .dash-stat .green { color: #16a34a; }
          .dash-stat .blue { color: #0284c7; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; color: #1e293b; }
          tr.frente-header { background-color: #e2e8f0; font-weight: bold; }
          .tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; }
          .tag-gob { background-color: #16a34a; }
          .tag-rentan { background-color: #0284c7; }
          .tag-alq { background-color: #f59e0b; }
          .tag-sc { background-color: #64748b; }
          
          .tag-activity { background-color: #475569; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: normal; color: white; display: inline-block; margin-top: 4px; }
          .tag-emergencia { background-color: #dc2626; }
          .tag-apc { background-color: #0284c7; }
          
          .badge-delta { display: inline-block; padding: 2px 5px; border-radius: 3px; font-size: 9px; font-weight: bold; line-height: 1.2; }
          .badge-delta-pos { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .badge-delta-zero { background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
          .badge-delta-neg { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

          .progress-container { width: 100%; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 4px; height: 14px; position: relative; }
          .progress-dual { display: flex; height: 100%; width: 100%; }
          .progress-prev { background-color: #0284c7; height: 100%; }
          .progress-delta { background-color: #16a34a; height: 100%; }
          .progress-text { position: absolute; width: 100%; text-align: center; font-size: 9px; font-weight: bold; color: #fff; top: 0; left: 0; line-height: 14px; text-shadow: 0px 0px 2px rgba(0,0,0,0.8); }
          .progress-text-dark { color: #334155; text-shadow: none; }

          .charts-container { display: flex; gap: 15px; margin-bottom: 25px; page-break-inside: avoid; }
          .chart-box { flex: 1; background: #fff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; }
          .chart-title { font-size: 13px; font-weight: bold; color: #1e3a8a; margin-top: 0; margin-bottom: 12px; text-align: center; }
          
          .bar-row { display: flex; align-items: center; margin-bottom: 7px; font-size: 11px; }
          .bar-label { width: 42%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; padding-right: 8px; }
          .bar-track { width: 58%; background: #e2e8f0; height: 14px; border-radius: 3px; overflow: hidden; position: relative; }
          .bar-fill { height: 100%; background: #0284c7; }
          .bar-value { position: absolute; right: 5px; top: 1px; font-weight: bold; color: #0f172a; font-size: 10px; }
          
          .signature-box { margin-top: 40px; page-break-inside: avoid; }
          .signature-img { width: 250px; max-height: 150px; object-fit: contain; margin-bottom: 0px; display: block; }
          
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 1.2cm; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img src="${logoGober}" class="header-img" onerror="this.style.display='none';" />
          <div class="header-text">
            <h2>GOBERNACIÓN DE ANTIOQUIA</h2>
            <h3>Secretaría de Infraestructura Física</h3>
          </div>
          <img src="${logoRentan}" class="header-img" onerror="this.style.display='none';" />
        </div>
        
        <div class="date-text">
          <p><strong>Fecha de Emisión:</strong> ${window.AppHelpers.escapeHTML(dateStr)}</p>
        </div>
        
        <h1>Reporte Ejecutivo: Frentes Activos y Maquinaria Asignada</h1>

        <div class="dashboard">
          <div class="dash-stat">
            <h4>Frentes Activos</h4>
            <div>${totalFrentes}</div>
          </div>
          <div class="dash-stat">
            <h4>Equipos Gobernación</h4>
            <div class="green">${totalPropios}</div>
          </div>
          <div class="dash-stat">
            <h4>Equipos Rentan</h4>
            <div class="blue">${totalRentan}</div>
          </div>
          <div class="dash-stat">
            <h4>Equipos Alquilados</h4>
            <div style="color: #f59e0b;">${totalAlquilados}</div>
          </div>
          ${totalSinClasificar > 0 ? `<div class="dash-stat">
            <h4>Sin clasificar</h4>
            <div style="color: #64748b;">${totalSinClasificar}</div>
          </div>` : ''}
          <div class="dash-stat">
            <h4>Total Equipos</h4>
            <div>${totalEquipos}</div>
          </div>
          <div class="dash-stat" style="border-left: 2px solid #cbd5e1; padding-left: 10px;">
            <h4>Avance Promedio</h4>
            <div class="green">${avgAvanceActual}%</div>
          </div>
          <div class="dash-stat">
            <h4>Incremento Semanal</h4>
            <div style="color: ${avgDeltaSemanal >= 0 ? '#16a34a' : '#dc2626'};">${avgDeltaSemanal >= 0 ? '+' : ''}${avgDeltaSemanal}%</div>
          </div>
        </div>

        <div class="charts-container">
          <div class="chart-box">
            <h4 class="chart-title">Frentes por Actividad</h4>
            <div style="display:flex; height: 26px; border-radius: 5px; overflow: hidden; margin-bottom: 10px; border: 1px solid #cbd5e1;">
               <div style="width: ${totalFrentes > 0 ? (typeStats['Emergencias Viales'] / totalFrentes) * 100 : 0}%; background: #dc2626; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold; overflow:hidden;" title="Emergencias">
                  ${typeStats['Emergencias Viales']}
               </div>
               <div style="width: ${totalFrentes > 0 ? (typeStats['Atención a Puntos Críticos'] / totalFrentes) * 100 : 0}%; background: #0284c7; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold; overflow:hidden;" title="APC">
                  ${typeStats['Atención a Puntos Críticos']}
               </div>
            </div>
            <div style="display:flex; justify-content:space-around; font-size:10px;">
              <div><span style="display:inline-block; width:9px; height:9px; background:#dc2626; border-radius:50%; margin-right:3px;"></span>Emergencias (${typeStats['Emergencias Viales']})</div>
              <div><span style="display:inline-block; width:9px; height:9px; background:#0284c7; border-radius:50%; margin-right:3px;"></span>APC (${typeStats['Atención a Puntos Críticos']})</div>
            </div>
          </div>
          
          <div class="chart-box">
            <h4 class="chart-title">Distribución por Subregión</h4>
            <div style="max-height: 120px; overflow: hidden;">
              ${sortedSubregions.slice(0, 4).map(sr => {
                 const pct = (subregionStats[sr] / totalFrentes) * 100;
                 return `
                 <div class="bar-row">
                   <div class="bar-label">${window.AppHelpers.escapeHTML(sr)}</div>
                   <div class="bar-track">
                     <div class="bar-fill" style="width: ${pct}%;"></div>
                     <div class="bar-value">${subregionStats[sr]}</div>
                   </div>
                 </div>`;
              }).join('')}
              ${sortedSubregions.length > 4 ? `<div style="text-align:center; font-size:10px; color:#64748b; margin-top:2px;">+${sortedSubregions.length - 4} subregiones más...</div>` : ''}
            </div>
          </div>

          <div class="chart-box" style="flex: 1.2;">
            <h4 class="chart-title">Mayor Avance Semanal (+Δ)</h4>
            <div style="max-height: 120px; overflow: hidden;">
              ${topIncrementos.length === 0 ? `
                <div style="font-size:11px; color:#64748b; text-align:center; padding-top:25px;">Sin variaciones registradas esta semana</div>
              ` : topIncrementos.map(item => `
                <div class="bar-row">
                  <div class="bar-label" title="${window.AppHelpers.escapeHTML(item.municipality)}">${window.AppHelpers.escapeHTML(item.municipality)}</div>
                  <div class="bar-track">
                    <div class="bar-fill" style="width: ${Math.min(100, item.delta * 2)}%; background: #16a34a;"></div>
                    <div class="bar-value" style="color:#15803d; font-weight:bold;">+${item.delta}%</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Frente de Obra / Municipio</th>
              <th style="width: 25%;">Tipo de Equipo</th>
              <th style="width: 15%;">Placa / Serie</th>
              <th style="width: 15%;">Propietario</th>
              <th style="width: 20%;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${frentes.map(f => {
              const actType = f.metadata && f.metadata.activityType ? f.metadata.activityType : 'Emergencias Viales';
              const actClass = actType.includes('Emergencia') ? 'tag-emergencia' : 'tag-apc';
              
              const { act: actVal, ant: antVal, delta: deltaVal } = F.getAvance(f);
              const deltaClass = deltaVal > 0 ? 'badge-delta-pos' : (deltaVal < 0 ? 'badge-delta-neg' : 'badge-delta-zero');
              const deltaSign = deltaVal > 0 ? '+' : '';
              const progColorClass = actVal > 35 ? 'progress-text' : 'progress-text progress-text-dark';
              
              let rows = `<tr class="frente-header">
                <td colspan="5">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      📍 ${window.AppHelpers.escapeHTML(f.municipality)} - ${window.AppHelpers.escapeHTML(f.name)}<br/>
                      <span class="tag-activity ${actClass}">${window.AppHelpers.escapeHTML(actType)}</span>
                      <span class="tag-activity" style="background:#64748b; margin-left:5px;">${window.AppHelpers.escapeHTML(f.metadata?.subregion || 'Subregión N/E')}</span>
                    </div>
                    <div style="min-width: 200px; text-align: right;">
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; margin-bottom:3px;">
                        <span style="color:#475569;">Sem. Ant: <strong>${antVal}%</strong> ➔ Act: <strong style="color:#0f172a;">${actVal}%</strong></span>
                        <span class="badge-delta ${deltaClass}">${deltaSign}${deltaVal}% sem.</span>
                      </div>
                      <div class="progress-container" style="height: 14px;">
                        <div class="progress-dual">
                          <div class="progress-prev" style="width: ${Math.min(antVal, actVal)}%;" title="Semana Anterior: ${antVal}%"></div>
                          <div class="progress-delta" style="width: ${Math.max(0, actVal - antVal)}%;" title="Incremento Semanal: +${deltaVal}%"></div>
                        </div>
                        <div class="${progColorClass}" style="line-height: 14px;">${actVal}%</div>
                      </div>
                      <div style="font-size:8px; color:#64748b; margin-top:2px; display:flex; justify-content:space-between;">
                        <span><span style="display:inline-block;width:6px;height:6px;background:#0284c7;border-radius:1px;margin-right:2px;"></span>Semana Anterior</span>
                        <span><span style="display:inline-block;width:6px;height:6px;background:#16a34a;border-radius:1px;margin-right:2px;"></span>Incremento Semanal</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>`;
              
              f.equipment.forEach(eq => {
                  const info = window.AppHelpers.getEquipmentOwnerInfo(eq.owner);
                  
                  rows += `<tr>
                    <td></td>
                    <td>${window.AppHelpers.escapeHTML(eq.type)}</td>
                    <td>${window.AppHelpers.escapeHTML(eq.plate || '-')}</td>
                    <td><span class="tag ${info.tagClass}">${window.AppHelpers.escapeHTML(info.label)}</span></td>
                    <td>${window.AppHelpers.escapeHTML(eq.status)}</td>
                  </tr>`;
              });
              return rows;
            }).join('')}
          </tbody>
        </table>

        <div class="signature-box">
          ${window.AppHelpers.getSignatureHTML('width: 250px; max-height: 150px; object-fit: contain; display: block;')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para ver el informe.");
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
})();
