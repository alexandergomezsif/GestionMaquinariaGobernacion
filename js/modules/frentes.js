window.AppModules = window.AppModules || {};

(function() {
  let currentSearchQuery = '';

  window.AppModules.frentesActivos = function(container) {
    const state = window.AppStore.getState();
    let frentes = state.frentesActivos || [];

    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      frentes = frentes.filter(f => 
        (f.municipality || '').toLowerCase().includes(q) || 
        (f.name || '').toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Frentes Activos</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Gestión de emergencias y puntos críticos con maquinaria asignada.</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="file" id="file-import-csv" accept=".csv, .xlsx" style="display: none;" />
            <button class="btn btn-secondary" id="btn-import-csv" style="background-color: var(--status-info); color: white; border: none;" title="Importar desde Excel">
              📥 Importar Excel (.csv, .xlsx)
            </button>
            <button class="btn btn-secondary" id="btn-weekly-progress" style="background-color: #0284c7; color: white; border: none;" title="Gestionar y comparar avances semanales">
              📊 Avance Semanal
            </button>
            <button class="btn btn-secondary" id="btn-export-frentes-pdf" style="background-color: var(--primary-dark); color: white; border: none;">
              📄 Generar Informe Ejecutivo
            </button>
            <button class="btn btn-primary" id="btn-add-frente">
              ➕ Nuevo Frente Manual
            </button>
          </div>
        </div>

        <div class="filter-bar" style="margin-bottom: 1.5rem;">
          <input type="text" id="frentes-search" class="form-control" placeholder="🔍 Buscar por municipio o frente..." value="${window.AppHelpers.escapeHTML(currentSearchQuery)}" style="max-width: 300px;" />
          <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 10px;">
            <strong>Leyenda:</strong> 
            <span style="display:inline-block; width:12px; height:12px; background:var(--primary-green); border-radius:3px;"></span> Gobernación
            <span style="display:inline-block; width:12px; height:12px; background:var(--status-info); border-radius:3px; margin-left: 10px;"></span> Rentan
            <span style="display:inline-block; width:12px; height:12px; background:#f59e0b; border-radius:3px; margin-left: 10px;"></span> Alquilados
            <button id="btn-open-map" class="btn btn-primary" style="margin-left: 15px; padding: 4px 10px; font-size: 0.8rem;">
              <i class="ti ti-map-2"></i> Ver Mapa
            </button>
          </div>
        </div>

        ${frentes.length === 0 ? `
          <div style="text-align:center; padding: 3rem; background: white; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚧</div>
            <h3 style="color: var(--text-secondary);">No hay frentes activos registrados</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Importa un archivo CSV con el reporte semanal o crea un frente manualmente.</p>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
            ${frentes.map(frente => renderFrenteCard(frente)).join('')}
          </div>
        `}
      </div>
    `;

    // Event Listeners
    const btnMap = document.getElementById('btn-open-map');
    if(btnMap) {
      btnMap.addEventListener('click', () => {
        const mapModal = document.getElementById('map-modal');
        if(mapModal) {
          mapModal.classList.add('active');
          if(!window.frentesMap && window.maplibregl) {
            window.frentesMap = new maplibregl.Map({
              container: 'map',
              style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
              center: [-75.5652, 6.2518],
              zoom: 6
            });
            window.frentesMap.addControl(new maplibregl.NavigationControl(), 'top-right');
            
            // Setup layers when map loads
            window.frentesMap.on('load', () => {
              const layersConfig = [
                { id: 'vias-primarias', layerIdx: 1, color: '#dc2626' },
                { id: 'vias-secundarias', layerIdx: 2, color: '#ea580c' },
                { id: 'vias-terciarias', layerIdx: 3, color: '#ca8a04' }
              ];
              
              layersConfig.forEach(conf => {
                window.frentesMap.addSource(conf.id, {
                  type: 'geojson',
                  data: `https://services5.arcgis.com/K90UQIB09TmTjUL8/arcgis/rest/services/R10/FeatureServer/${conf.layerIdx}/query?where=1=1&outFields=*&f=geojson`
                });
                
                window.frentesMap.addLayer({
                  id: conf.id,
                  type: 'line',
                  source: conf.id,
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: {
                    'line-color': conf.color,
                    'line-width': 3
                  }
                });

                // Click event for popups
                window.frentesMap.on('click', conf.id, (e) => {
                  const prop = e.features[0].properties;
                  new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`
                      <div style="font-family:sans-serif;font-size:0.8rem;color:#333;">
                        <h4 style="margin:0 0 5px;color:#1e3a8a;">${prop.NOMBRE_VIA || 'Sin nombre'}</h4>
                        <div><strong>Código:</strong> ${prop.CODIGO_VIA || '-'}</div>
                        <div><strong>Competente:</strong> ${prop.COMPETENTE || '-'}</div>
                      </div>
                    `)
                    .addTo(window.frentesMap);
                });
                
                window.frentesMap.on('mouseenter', conf.id, () => {
                  window.frentesMap.getCanvas().style.cursor = 'pointer';
                });
                window.frentesMap.on('mouseleave', conf.id, () => {
                  window.frentesMap.getCanvas().style.cursor = '';
                });
              });

              // Setup Toggle logic
              document.getElementById('toggle-layer-1').addEventListener('change', (e) => {
                window.frentesMap.setLayoutProperty('vias-primarias', 'visibility', e.target.checked ? 'visible' : 'none');
              });
              document.getElementById('toggle-layer-2').addEventListener('change', (e) => {
                window.frentesMap.setLayoutProperty('vias-secundarias', 'visibility', e.target.checked ? 'visible' : 'none');
              });
              document.getElementById('toggle-layer-3').addEventListener('change', (e) => {
                window.frentesMap.setLayoutProperty('vias-terciarias', 'visibility', e.target.checked ? 'visible' : 'none');
              });

              // Search Logic
              document.getElementById('map-search-btn').addEventListener('click', executeMapSearch);
              document.getElementById('map-search-input').addEventListener('keypress', (e) => {
                if(e.key === 'Enter') executeMapSearch();
              });

              function executeMapSearch() {
                const term = document.getElementById('map-search-input').value.trim();
                const loading = document.getElementById('map-loading');
                if(!term) {
                  // Reset all
                  layersConfig.forEach(conf => {
                    window.frentesMap.getSource(conf.id).setData(`https://services5.arcgis.com/K90UQIB09TmTjUL8/arcgis/rest/services/R10/FeatureServer/${conf.layerIdx}/query?where=1=1&outFields=*&f=geojson`);
                  });
                  return;
                }
                
                loading.style.display = 'block';
                const whereClause = `NOMBRE_VIA LIKE '%25${term}%25' OR CODIGO_VIA LIKE '%25${term}%25'`;
                let loaded = 0;
                
                layersConfig.forEach(conf => {
                  const url = `https://services5.arcgis.com/K90UQIB09TmTjUL8/arcgis/rest/services/R10/FeatureServer/${conf.layerIdx}/query?where=${whereClause}&outFields=*&f=geojson`;
                  window.frentesMap.getSource(conf.id).setData(url);
                  
                  // In a real app we'd wait for source.setData to finish or use idle event, simple timeout here
                  setTimeout(() => {
                    loaded++;
                    if(loaded === 3) loading.style.display = 'none';
                  }, 1500);
                });
              }

              // NEW: Load Frentes Markers
              loadActiveFrentesMarkers();
            });

            // Keep track of markers to remove them if needed
            window.frentesMarkers = [];

            function loadActiveFrentesMarkers() {
              const frentes = window.AppStore.getState().frentesActivos || [];
              if (frentes.length === 0) return;

              // Extract codes
              const queries = [];
              const frentesMapByCode = {};

              frentes.forEach(f => {
                const parts = f.name.split(' ');
                // Guess code is the last part if it contains numbers and hyphens
                let code = parts[parts.length - 1];
                if (!/[0-9]/.test(code)) {
                  // Fallback: use the whole name as code query
                  code = f.name.trim();
                }
                
                // Add to where clause array
                queries.push(`CODIGO_VIA LIKE '%25${code}%25' OR NOMBRE_VIA LIKE '%25${code}%25'`);
                frentesMapByCode[code] = f;
              });

              // ArcGIS often limits where clauses. We can batch them.
              // For safety, let's just do a big OR query. If it fails, it fails gracefully.
              const chunkSize = 15;
              for (let i = 0; i < queries.length; i += chunkSize) {
                const chunk = queries.slice(i, i + chunkSize);
                const whereClause = chunk.join(' OR ');
                
                [1, 2, 3].forEach(layerIdx => {
                  const url = `https://services5.arcgis.com/K90UQIB09TmTjUL8/arcgis/rest/services/R10/FeatureServer/${layerIdx}/query?where=${whereClause}&outFields=*&f=geojson`;
                  
                  fetch(url).then(res => res.json()).then(data => {
                    if (data && data.features) {
                      data.features.forEach(feat => {
                        const props = feat.properties;
                        // Find matching frente
                        let matchedFrente = null;
                        let matchedCode = null;
                        for (let code in frentesMapByCode) {
                          if ((props.CODIGO_VIA && props.CODIGO_VIA.includes(code)) || 
                              (props.NOMBRE_VIA && props.NOMBRE_VIA.includes(code))) {
                            matchedFrente = frentesMapByCode[code];
                            matchedCode = code;
                            break;
                          }
                        }

                        if (matchedFrente && feat.geometry && feat.geometry.coordinates) {
                          // Approximate Centroid (take middle coordinate of first line segment)
                          let coords = feat.geometry.coordinates;
                          if (feat.geometry.type === 'MultiLineString') coords = coords[0];
                          if (!coords || coords.length === 0) return;
                          
                          const midIdx = Math.floor(coords.length / 2);
                          const center = coords[midIdx];

                          const actType = matchedFrente.activityType || 'Emergencias Viales';
                          const actIcon = actType === 'Emergencias Viales' ? 'icono-emergencias.png' : 'icono-puntos.png';
                          const actColor = actType === 'Emergencias Viales' ? '#dc2626' : '#ca8a04';

                          // Create Marker
                          const el = document.createElement('div');
                          el.className = 'frente-marker';
                          el.style.width = '32px';
                          el.style.height = '32px';
                          el.style.backgroundColor = 'white';
                          el.style.border = `2px solid ${actColor}`;
                          el.style.borderRadius = '50%';
                          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
                          el.style.cursor = 'pointer';
                          el.style.display = 'flex';
                          el.style.alignItems = 'center';
                          el.style.justifyContent = 'center';
                          el.innerHTML = `<img src="img/${actIcon}" style="width:22px; height:22px; object-fit:contain;" alt="Frente">`;

                          let eqSummaryHtml = '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; margin-bottom:8px;">';
                          if (matchedFrente.equipment) {
                             const eqGroups = {};
                             matchedFrente.equipment.forEach(e => {
                                 const type = window.AppHelpers.escapeHTML(e.type);
                                 if(!eqGroups[type]) eqGroups[type] = 0;
                                 eqGroups[type]++;
                             });
                             for(const [type, count] of Object.entries(eqGroups)) {
                                 eqSummaryHtml += `
                                     <div style="display:flex; align-items:center; background:#f1f5f9; padding:2px 6px; border-radius:4px; border:1px solid #e2e8f0;" title="${type}">
                                         ${window.AppHelpers.getEquipmentIcon(type, 16)} 
                                         <span style="font-weight:bold; font-size:0.75rem; color:var(--primary-dark);">x${count}</span>
                                     </div>
                                 `;
                             }
                          }
                          eqSummaryHtml += '</div>';

                          const popupHtml = `
                            <div style="font-family:sans-serif;font-size:0.85rem;color:#333; min-width: 240px; padding-top: 5px;">
                              <div style="display:flex; align-items:center; background:${actColor}15; color:${actColor}; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.7rem; text-transform:uppercase; margin-bottom:6px; display:inline-flex;">
                                  <img src="img/${actIcon}" style="width:14px; height:14px; margin-right:4px; object-fit:contain;" alt="Icon">
                                  ${actType}
                              </div>
                              <h3 style="margin:0 0 4px;color:var(--primary-dark); font-size:1.05rem;">
                                📍 ${window.AppHelpers.escapeHTML(matchedFrente.municipality)}
                              </h3>
                              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
                                ${window.AppHelpers.escapeHTML(matchedFrente.name)}
                              </div>
                              
                              ${eqSummaryHtml}
                              
                              <div style="background: #f8fafc; border-radius: 4px; padding: 6px; font-size: 0.75rem; color: var(--text-secondary);">
                                ${matchedFrente.metadata && matchedFrente.metadata.estadoVia ? `<div style="margin-bottom:2px;"><strong>🛣️ Estado:</strong> ${window.AppHelpers.escapeHTML(matchedFrente.metadata.estadoVia)}</div>` : ''}
                                ${matchedFrente.metadata && matchedFrente.metadata.avance ? `<div style="margin-bottom:2px;"><strong>📈 Avance:</strong> ${window.AppHelpers.escapeHTML(matchedFrente.metadata.avance)}</div>` : ''}
                                ${matchedFrente.metadata && matchedFrente.metadata.longitud ? `<div style="margin-bottom:2px;"><strong>📏 Longitud:</strong> ${window.AppHelpers.escapeHTML(matchedFrente.metadata.longitud)}</div>` : ''}
                                ${matchedFrente.metadata && matchedFrente.metadata.km ? `<div><strong>📍 Km Atención:</strong> ${window.AppHelpers.escapeHTML(matchedFrente.metadata.km)}</div>` : ''}
                              </div>
                            </div>
                          `;

                          const marker = new maplibregl.Marker({ element: el })
                            .setLngLat(center)
                            .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
                            .addTo(window.frentesMap);

                          window.frentesMarkers.push(marker);
                          
                          // Remove from dict so we don't place duplicate markers if it crosses layers
                          delete frentesMapByCode[matchedCode]; 
                        }
                      });
                    }
                  }).catch(e => console.error("Error fetching ArcGIS Layer", e));
                });
              }
            }
          } else if(window.frentesMap) {
            setTimeout(() => window.frentesMap.resize(), 100);
          }
        }
      });
    }
    
    const mapModalClose = document.getElementById('map-modal-close');
    const closeMapModal = () => {
        const modal = document.getElementById('map-modal');
        if (modal) modal.classList.remove('active');
    };
    if(mapModalClose) {
      mapModalClose.addEventListener('click', closeMapModal);
    }
    
    // ESC key listener for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMapModal();
        }
    });

    document.getElementById('frentes-search').addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      window.AppModules.frentesActivos(container);
    });

    document.getElementById('btn-add-frente').addEventListener('click', () => {
      alert("Función de creación manual en desarrollo. Usa la importación CSV por ahora.");
    });

    // CSV / Excel Import handling with pre-import verification modal
    document.getElementById('btn-import-csv').addEventListener('click', () => {
      openImportInstructionModal();
    });

    function openImportInstructionModal() {
      const modalHTML = `
        <div class="modal-overlay active" id="modal-import-instructions">
          <div class="modal-content" style="max-width: 540px; background: white;">
            <div class="modal-header">
              <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.3rem;">📋</span> Recomendaciones previas a la Importación
              </div>
              <button type="button" class="modal-close" id="modal-close-import">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.25rem;">
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 4px; margin-bottom: 1.25rem;">
                <strong style="color: #166534; display: block; margin-bottom: 4px;">🚀 Motor de Detección Dinámica Inteligente:</strong>
                <span style="color: #14532d; font-size: 0.88rem;">El sistema identifica automáticamente las columnas clave de su archivo Excel/CSV y asigna la maquinaria por propietario (Gobernación, Rentan, Alquilados).</span>
              </div>

              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; color: var(--text-primary);">
                <li style="display: flex; align-items: flex-start; gap: 10px; background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 1.1rem; color: #0284c7;">ℹ️</span>
                  <div>
                    <strong>Tolerancia de Columnas y Variaciones:</strong><br/>
                    <span style="color: var(--text-secondary); font-size: 0.82rem;">Si su archivo contiene columnas adicionales como Señalización, el motor las detectará y mantendrá intacta la asignación de equipos.</span>
                  </div>
                </li>
                <li style="display: flex; align-items: flex-start; gap: 10px; background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 1.1rem; color: #16a34a;">🛡️</span>
                  <div>
                    <strong>Filtrado Automático de ZODMES y Totales:</strong><br/>
                    <span style="color: var(--text-secondary); font-size: 0.82rem;">Las filas al final del reporte (ZODMES, Disponibilidad, Stand By o Resúmenes) son ignoradas automáticamente para evitar falsos positivos o frentes fantasma.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="modal-footer" style="background: white; border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.25rem;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-import">Cancelar</button>
              <button type="button" class="btn btn-primary" id="btn-proceed-import" style="background-color: var(--status-info); border-color: var(--status-info);">
                📂 Seleccionar y Cargar Archivo
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = document.getElementById('modal-import-instructions');
      const closeModal = () => modal.remove();

      document.getElementById('modal-close-import').addEventListener('click', closeModal);
      document.getElementById('btn-cancel-import').addEventListener('click', closeModal);
      document.getElementById('btn-proceed-import').addEventListener('click', () => {
        closeModal();
        document.getElementById('file-import-csv').click();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.getElementById('file-import-csv').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

      if (isExcel) {
        if (typeof XLSX === 'undefined') {
            alert("La librería de Excel no se cargó correctamente. Contacte a soporte.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = new Uint8Array(ev.target.result);
          try {
            const workbook = XLSX.read(data, { type: 'array' });
            handleExcelWorkbookImport(workbook, file.name);
          } catch(err) {
            console.error(err);
            alert("Error procesando el archivo Excel. Asegúrate de que no esté corrupto.");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target.result;
          processCSVImport(text);
        };
        reader.readAsText(file);
      }
      
      e.target.value = ''; // Reset input
    });

    /**
     * Evalúa las hojas del libro de Excel y permite al usuario elegir la semana u hoja correspondiente
     */
    function handleExcelWorkbookImport(workbook, fileName) {
      const cleanFileName = (fileName || '').toUpperCase().replace(/[_\-]+/g, ' ');
      const sheetCandidates = [];

      for (let idx = 0; idx < workbook.SheetNames.length; idx++) {
        const name = workbook.SheetNames[idx];
        const sheet = workbook.Sheets[name];
        if (!sheet || !sheet['!ref']) continue;
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const rowCount = range.e.r - range.s.r + 1;
        if (rowCount < 5) continue; // descartar hojas vacías o auxiliares

        let isOperational = false;
        let score = 0;

        try {
          const sampleCsv = XLSX.utils.sheet_to_csv(sheet, { FS: ';', blankrows: false });
          const sampleUpper = sampleCsv.slice(0, 4000).toUpperCase();
          const hasMpio = sampleUpper.includes('MUNICIPIO');
          const hasEq = sampleUpper.includes('EQUIPO') || sampleUpper.includes('MAQUINARIA');
          const hasGob = sampleUpper.includes('GOB') || sampleUpper.includes('RENTAN') || sampleUpper.includes('ALQ');

          if (hasMpio && (hasEq || hasGob)) {
            isOperational = true;
            score = 100 + (idx * 50); // preferencia cronológica por las hojas más recientes al final del libro

            const cleanSheetName = name.toUpperCase().replace(/[_\-]+/g, ' ');
            const sheetWords = cleanSheetName.split(/\s+/).filter(w => w.length > 2);
            const matchCount = sheetWords.filter(w => cleanFileName.includes(w)).length;
            if (matchCount > 0) {
              score += matchCount * 5000; // coincidencia directa con el nombre del archivo
            }
          }
        } catch(e) {}

        sheetCandidates.push({
          name: name,
          rowCount: rowCount,
          isOperational: isOperational,
          score: score
        });
      }

      const operationalSheets = sheetCandidates.filter(s => s.isOperational);
      operationalSheets.sort((a, b) => b.score - a.score);

      if (operationalSheets.length === 0) {
        // Fallback: usar la hoja con más datos
        let largest = workbook.SheetNames[0];
        let maxR = 0;
        for (let n of workbook.SheetNames) {
          const s = workbook.Sheets[n];
          if (!s || !s['!ref']) continue;
          const r = XLSX.utils.decode_range(s['!ref']);
          const cnt = r.e.r - r.s.r + 1;
          if (cnt > maxR) { maxR = cnt; largest = n; }
        }
        const ws = workbook.Sheets[largest];
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
        processCSVImport(csv);
        return;
      }

      if (operationalSheets.length === 1) {
        // Solo hay 1 hoja de frentes: importar directamente
        const targetSheet = operationalSheets[0].name;
        const ws = workbook.Sheets[targetSheet];
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
        processCSVImport(csv);
        return;
      }

      // Existen múltiples semanas/hojas: mostrar modal para selección transparente
      openSelectSheetModal(workbook, operationalSheets, fileName);
    }

    /**
     * Modal interactivo para seleccionar la semana/hoja a procesar de un libro de Excel
     */
    function openSelectSheetModal(workbook, sheets, fileName) {
      const modalId = 'modal-select-sheet';
      const existing = document.getElementById(modalId);
      if (existing) existing.remove();

      const optionsHtml = sheets.map((s, idx) => {
        const isRec = idx === 0;
        return `
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 2px solid ${isRec ? '#0284c7' : '#e2e8f0'}; background: ${isRec ? '#f0f9ff' : 'white'}; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="radio" name="selected_sheet" value="${s.name}" ${isRec ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #0284c7;">
              <div>
                <strong style="font-size: 0.95rem; color: #1e293b; display: block;">${s.name}</strong>
                <span style="font-size: 0.8rem; color: #64748b;">${s.rowCount} filas de registro</span>
              </div>
            </div>
            ${isRec ? '<span style="background: #0284c7; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">✨ Recomendada (Semana Actual)</span>' : ''}
          </label>
        `;
      }).join('');

      const modalHTML = `
        <div class="modal-overlay active" id="${modalId}">
          <div class="modal-content" style="max-width: 520px; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div class="modal-header" style="border-bottom: 1px solid #e2e8f0; padding: 1.25rem;">
              <div class="modal-title" style="display:flex; align-items:center; gap:8px; font-size: 1.15rem; font-weight: 700; color: #0f172a;">
                <span style="font-size:1.3rem;">📑</span> Seleccionar Semana / Hoja del Archivo
              </div>
              <button type="button" class="modal-close" id="modal-close-sheet-select">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.25rem;">
              <p style="font-size: 0.88rem; color: #475569; margin-top: 0; margin-bottom: 1rem;">
                El archivo contiene reportes de varias semanas operativas. Seleccione la hoja que desea procesar:
              </p>
              <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
                ${optionsHtml}
              </div>
            </div>
            <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.25rem;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-sheet-select">Cancelar</button>
              <button type="button" class="btn btn-primary" id="btn-confirm-sheet-select" style="background-color: #0284c7; border-color: #0284c7;">
                📥 Importar Hoja Seleccionada
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = document.getElementById(modalId);
      const closeModal = () => modal.remove();

      document.getElementById('modal-close-sheet-select').addEventListener('click', closeModal);
      document.getElementById('btn-cancel-sheet-select').addEventListener('click', closeModal);
      
      document.getElementById('btn-confirm-sheet-select').addEventListener('click', () => {
        const checked = modal.querySelector('input[name="selected_sheet"]:checked');
        if (!checked) {
          alert("Por favor seleccione una hoja.");
          return;
        }
        const selectedName = checked.value;
        closeModal();
        const ws = workbook.Sheets[selectedName];
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
        processCSVImport(csv);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    const btnWeeklyProgress = document.getElementById('btn-weekly-progress');
    if (btnWeeklyProgress) {
      btnWeeklyProgress.addEventListener('click', () => {
        openWeeklyProgressModal(window.AppStore.getState().frentesActivos || []);
      });
    }

    document.getElementById('btn-export-frentes-pdf').addEventListener('click', () => {
      generateFrentesPDF(state.frentesActivos || []);
    });
  };

  /**
   * Extrae de forma segura el porcentaje numérico (0 - 100) de un string o valor
   */
  function parseAvanceNum(val) {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return Math.min(100, Math.max(0, Math.round(val)));
    const str = String(val).trim();
    const m = str.match(/(\d+(?:\.\d+)?)\s*%/);
    if (m) return Math.min(100, Math.max(0, Math.round(parseFloat(m[1]))));
    const m2 = str.match(/(\d+(?:\.\d+)?)/);
    if (m2) {
      const num = parseFloat(m2[1]);
      if (num <= 100) return Math.min(100, Math.max(0, Math.round(num)));
    }
    return 0;
  }

  /**
   * Modal interactivo para visualizar y ajustar avances semanales de cada frente
   */
  function openWeeklyProgressModal(frentes) {
    if (!frentes || frentes.length === 0) {
      alert("No hay frentes activos registrados. Primero importe un archivo Excel.");
      return;
    }

    const rowsHtml = frentes.map((f, idx) => {
      const actVal = f.metadata && f.metadata.avanceActual !== undefined ? f.metadata.avanceActual : parseAvanceNum(f.metadata?.avance);
      const antVal = f.metadata && f.metadata.avanceAnterior !== undefined ? f.metadata.avanceAnterior : 0;
      const delta = actVal - antVal;
      const deltaClass = delta > 0 ? 'badge-delta-pos' : (delta < 0 ? 'badge-delta-neg' : 'badge-delta-zero');
      const deltaSign = delta > 0 ? '+' : '';

      return `
        <tr data-index="${idx}" style="border-bottom: 1px solid var(--card-border);">
          <td style="padding: 8px 10px; font-weight: 600; color: var(--primary-dark);">
            📍 ${window.AppHelpers.escapeHTML(f.municipality)}
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 400;">${window.AppHelpers.escapeHTML(f.name)}</div>
          </td>
          <td style="padding: 8px 10px; font-size: 0.8rem; color: #64748b;">
            ${window.AppHelpers.escapeHTML(f.subregion || f.metadata?.subregion || 'N/E')}
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <input type="number" min="0" max="100" class="form-control input-ant" data-idx="${idx}" value="${antVal}" style="width: 75px; text-align: center; display: inline-block; padding: 4px;" /> %
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <input type="number" min="0" max="100" class="form-control input-act" data-idx="${idx}" value="${actVal}" style="width: 75px; text-align: center; display: inline-block; padding: 4px; font-weight: bold;" /> %
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <span class="badge-delta ${deltaClass} delta-display-${idx}">${deltaSign}${delta}%</span>
          </td>
        </tr>
      `;
    }).join('');

    const modalHTML = `
      <div class="modal-overlay active" id="modal-weekly-progress">
        <div class="modal-content" style="max-width: 820px; width: 95%; max-height: 90vh; display: flex; flex-direction: column; background: white; padding: 0;">
          <div class="modal-header" style="background: var(--primary-dark); color: white; padding: 12px 20px; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
            <div class="modal-title" style="display:flex; align-items:center; gap:8px; color: white;">
              <span>📊</span> Seguimiento de Avance Semanal (Comparativa vs Semana Anterior)
            </div>
            <button type="button" class="modal-close" id="modal-close-weekly" style="color: white;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 15px 20px; overflow-y: auto; flex-grow: 1;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0; margin-bottom: 12px;">
              Aquí puedes revisar y ajustar el avance porcentual (%) de cada frente de obra en la semana anterior y la semana actual. El incremento semanal (Δ) se recalcula automáticamente.
            </p>
            <div class="table-container" style="border: 1px solid var(--card-border); border-radius: 6px; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background: #f8fafc; color: #1e293b; border-bottom: 2px solid var(--card-border); text-align: left;">
                    <th style="padding: 10px;">Frente / Municipio</th>
                    <th style="padding: 10px;">Subregión</th>
                    <th style="padding: 10px; text-align: center;">Sem. Anterior</th>
                    <th style="padding: 10px; text-align: center;">Sem. Actual</th>
                    <th style="padding: 10px; text-align: center;">Incremento Semanal (Δ)</th>
                  </tr>
                </thead>
                <tbody id="tbody-weekly-progress">
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer" style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #64748b;">Total Frentes: <strong>${frentes.length}</strong></span>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-weekly">Cancelar</button>
              <button type="button" class="btn btn-primary" id="btn-save-weekly" style="background-color: var(--primary-green); border-color: var(--primary-green);">
                💾 Guardar Cambios de Avance
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('modal-weekly-progress');
    const closeModal = () => modal.remove();

    document.getElementById('modal-close-weekly').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-weekly').addEventListener('click', closeModal);

    // Live recalculation on input change
    const updateRowDelta = (idx) => {
      const inputAnt = modal.querySelector(`.input-ant[data-idx="${idx}"]`);
      const inputAct = modal.querySelector(`.input-act[data-idx="${idx}"]`);
      const badge = modal.querySelector(`.delta-display-${idx}`);
      if (!inputAnt || !inputAct || !badge) return;

      const ant = Math.min(100, Math.max(0, parseInt(inputAnt.value, 10) || 0));
      const act = Math.min(100, Math.max(0, parseInt(inputAct.value, 10) || 0));
      const delta = act - ant;

      badge.className = `badge-delta delta-display-${idx} ${delta > 0 ? 'badge-delta-pos' : (delta < 0 ? 'badge-delta-neg' : 'badge-delta-zero')}`;
      badge.textContent = `${delta > 0 ? '+' : ''}${delta}%`;
    };

    modal.querySelectorAll('.input-ant, .input-act').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        updateRowDelta(idx);
      });
    });

    // Save changes into AppStore
    document.getElementById('btn-save-weekly').addEventListener('click', () => {
      const updatedFrentes = [...frentes];
      updatedFrentes.forEach((f, idx) => {
        const inputAnt = modal.querySelector(`.input-ant[data-idx="${idx}"]`);
        const inputAct = modal.querySelector(`.input-act[data-idx="${idx}"]`);
        if (inputAnt && inputAct) {
          const ant = Math.min(100, Math.max(0, parseInt(inputAnt.value, 10) || 0));
          const act = Math.min(100, Math.max(0, parseInt(inputAct.value, 10) || 0));
          const delta = act - ant;
          f.metadata = f.metadata || {};
          f.metadata.avanceAnterior = ant;
          f.metadata.avanceActual = act;
          f.metadata.deltaSemanal = delta;
          f.metadata.avance = `${act}%`;
        }
      });

      window.AppStore.updateState('frentesActivos', updatedFrentes);
      closeModal();
      if (window.AppModules.frentesActivos) {
        window.AppModules.frentesActivos(document.getElementById('app-main'));
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }


  function renderFrenteCard(frente) {
    const eqPropios = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isGob);
    const eqRentan = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isRentan);
    const eqAlquilados = frente.equipment.filter(e => window.AppHelpers.getEquipmentOwnerInfo(e.owner).isAlquilado);

    const actType = frente.activityType || 'Emergencias Viales';
    const actIcon = actType === 'Emergencias Viales' ? 'icono-emergencias.png' : 'icono-puntos.png';
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
            <div style="display:flex; align-items:center; background:#f1f5f9; padding:3px 6px; border-radius:4px; border:1px solid #e2e8f0;" title="${type}">
                ${window.AppHelpers.getEquipmentIcon(type, 18)} 
                <span style="font-weight:bold; font-size:0.8rem; color:var(--primary-dark);">x${count}</span>
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
                <img src="img/${actIcon}" style="width:16px; height:16px; margin-right:6px; object-fit:contain;" alt="${window.AppHelpers.escapeHTML(actType)}">
                ${window.AppHelpers.escapeHTML(actType)}
            </div>
            <span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
              ${window.AppHelpers.escapeHTML(frente.date || window.AppHelpers.getFormattedCurrentDate())}
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 style="margin: 0; color: var(--primary-dark); font-size: 1.1rem; line-height: 1.2;">
              📍 ${window.AppHelpers.escapeHTML(frente.municipality)}
            </h3>
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:-2px; margin-bottom:8px; font-weight:600; text-transform:uppercase;">
            🌎 Subregión: <span style="color:var(--primary-dark);">${window.AppHelpers.escapeHTML(frente.subregion || 'Desconocida')}</span>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px; font-weight: 500;">
            ${window.AppHelpers.escapeHTML(frente.name)}
          </div>
          
          ${eqSummaryHtml}
          
          ${frente.metadata && (frente.metadata.estadoVia || frente.metadata.avance || frente.metadata.avanceActual !== undefined || frente.metadata.longitud || frente.metadata.km) ? `
          <div style="background: #f8fafc; border-radius: 4px; padding: 8px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
            ${frente.metadata.estadoVia ? `<div style="margin-bottom:4px;"><strong>🛣️ Estado:</strong> ${window.AppHelpers.escapeHTML(frente.metadata.estadoVia)}</div>` : ''}
            ${(() => {
                const actVal = frente.metadata && frente.metadata.avanceActual !== undefined ? frente.metadata.avanceActual : parseAvanceNum(frente.metadata?.avance);
                const antVal = frente.metadata && frente.metadata.avanceAnterior !== undefined ? frente.metadata.avanceAnterior : 0;
                const deltaVal = frente.metadata && frente.metadata.deltaSemanal !== undefined ? frente.metadata.deltaSemanal : (actVal - antVal);
                const deltaClass = deltaVal > 0 ? 'badge-delta-pos' : (deltaVal < 0 ? 'badge-delta-neg' : 'badge-delta-zero');
                const deltaSign = deltaVal > 0 ? '+' : '';
                return `
                  <div style="margin-top:4px; margin-bottom:6px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:6px 8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <strong style="color:var(--primary-dark);">📈 Avance: <span style="font-size:0.9rem;">${actVal}%</span></strong>
                      <span class="badge-delta ${deltaClass}">${deltaSign}${deltaVal}% sem.</span>
                    </div>
                    <div class="progress-container" style="height:12px; margin-bottom:3px;">
                      <div class="progress-dual">
                        <div class="progress-prev" style="width: ${Math.min(antVal, actVal)}%;" title="Semana Anterior: ${antVal}%"></div>
                        <div class="progress-delta" style="width: ${Math.max(0, actVal - antVal)}%;" title="Incremento Semanal: +${deltaVal}%"></div>
                      </div>
                      <div class="progress-text" style="line-height:12px;">${actVal}%</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#64748b;">
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
            </span>
          </div>

          <ul style="list-style: none; padding: 0; margin: 0; display:flex; flex-direction:column; gap:6px;">
            ${frente.equipment.map(eq => {
              const ownerInfo = window.AppHelpers.getEquipmentOwnerInfo(eq.owner);

              return `
                <li style="display:flex; justify-content:space-between; align-items:center; background: #ffffff; padding: 6px 8px; border-radius: 4px; border-left: 3px solid ${ownerInfo.color}; border: 1px solid var(--card-border);">
                  <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <span style="font-size: 0.75rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--primary-dark);" title="${window.AppHelpers.escapeHTML(eq.type)}">
                      ${window.AppHelpers.getEquipmentIcon(eq.type)} ${window.AppHelpers.escapeHTML(eq.type)}
                    </span>
                    <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">Placa/Id: ${window.AppHelpers.escapeHTML(eq.plate || 'N/A')}</span>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span style="font-size: 0.65rem; background: ${ownerInfo.color}; color: white; padding: 2px 4px; border-radius: 3px; font-weight:bold;">
                      ${ownerInfo.key}
                    </span>
                    <span style="font-size: 0.65rem; margin-top:2px; color: ${eq.status.toLowerCase().includes('operativo') ? 'var(--status-success)' : 'var(--status-danger)'};">
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

  

  function processCSVImport(csvText) {
    const delimiter = csvText.split(/[\r\n]+/)[0].includes(';') ? ';' : ',';
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i+1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++; 
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          if (char === '\r') i++; 
        } else {
          currentCell += char;
        }
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    if (rows.length < 3) {
      alert("El archivo CSV no tiene suficientes datos.");
      return;
    }

    const removeAccents = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. Detección dinámica de la fila de categorías (GOB, RENTAN, ALQUILADOS)
    let gobIdx = -1, rentanIdx = -1, alqIdx = -1;
    let categoryRowIdx = -1;

    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const rowStr = removeAccents(rows[r].join(' ').toUpperCase());
      if (rowStr.includes('GOB') && (rowStr.includes('RENTAN') || rowStr.includes('ALQ'))) {
        categoryRowIdx = r;
        for (let c = 0; c < rows[r].length; c++) {
          const cell = removeAccents((rows[r][c] || '').toUpperCase().trim());
          if (cell.includes('GOB') && gobIdx === -1) gobIdx = c;
          if (cell.includes('RENTAN') && rentanIdx === -1) rentanIdx = c;
          if (cell.includes('ALQUILAD') && alqIdx === -1) alqIdx = c;
        }
        break;
      }
    }

    // 2. Detección dinámica de la fila de encabezados principales
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const rowStr = removeAccents(rows[r].join(' ').toUpperCase());
      if (rowStr.includes('MUNICIPIO') && (rowStr.includes('EQUIPO') || rowStr.includes('VIA') || rowStr.includes('FRENTE'))) {
        headerRowIdx = r;
        break;
      }
    }

    // 3. Mapeo inteligente de índices de columnas
    let subregionCol = 0;
    let mpioCol = 2;
    let frenteCol = 3;
    let equipoCol = 7;
    let serieCol = 8;
    let obsCol = 9;
    let obsValCol = 10;

    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let c = 0; c < hRow.length; c++) {
        const cu = removeAccents((hRow[c] || '').toUpperCase().trim());
        if (cu.includes('SUBREGION')) subregionCol = c;
        else if (cu.includes('MUNICIPIO')) mpioCol = c;
        else if (cu.includes('VIA') || cu.includes('FRENTE') || cu.includes('TRAMO') || cu.includes('LOCALIZACION')) frenteCol = c;
        else if ((cu.includes('EQUIPO') || cu.includes('MAQUINARIA')) && !cu.includes('ESTADO')) equipoCol = c;
        else if (cu.includes('SERIE') || cu.includes('PLACA') || cu.includes('IDENTIFICACION')) serieCol = c;
        else if (cu.includes('OBSERVA')) {
          obsCol = c;
          obsValCol = c + 1;
        }
      }
    }

    // Determinación de la columna de inicio de la matriz de maquinaria
    const candidateCols = [gobIdx, rentanIdx, alqIdx].filter(idx => idx !== -1);
    let firstMachineCol = 11;
    if (candidateCols.length > 0) {
      firstMachineCol = Math.min(...candidateCols);
    } else {
      firstMachineCol = Math.max(obsValCol + 1, 11);
      gobIdx = 11;
      rentanIdx = 17;
      alqIdx = 23;
    }

    let currentMunicipio = 'Desconocido';
    let currentSubregion = 'Desconocida';
    let currentFrente = 'Punto Crítico';
    let currentActivityType = 'Emergencias Viales';
    const data = [];
    const frenteMetadata = {};

    // Pre-escaneo de actividad
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const rStr = removeAccents(rows[i].join(' ').toUpperCase());
      if (rStr.includes('EMERGENCIAS VIALES')) currentActivityType = 'Emergencias Viales';
      else if (rStr.includes('PUNTOS CRITICOS') || rStr.includes('APC')) currentActivityType = 'Atención a Puntos Críticos';
    }

    // Mapa de frentes previos para delta semanal automático
    const existingFrentes = window.AppStore.getState().frentesActivos || [];
    const previousProgressMap = {};
    existingFrentes.forEach(f => {
      const k = (f.municipality || '').toUpperCase() + " - " + (f.name || '').toUpperCase();
      const act = f.metadata && f.metadata.avanceActual !== undefined ? f.metadata.avanceActual : parseAvanceNum(f.metadata?.avance);
      previousProgressMap[k] = act;
    });

    // Catálogo de normalización de maquinaria
    const knownMachines = {
      'RT': 'RETROEXCAVADORA',
      'VQ DT': 'VOLQUETA DOBLETROQUE',
      'EXC 13T': 'EXCAVADORA 13 TONELADAS',
      'EXC 14T': 'EXCAVADORA 14 TONELADAS',
      'EXC 20T': 'EXCAVADORA 20 TONELADAS',
      'EXC 21T': 'EXCAVADORA 21 TONELADAS',
      'MINI C': 'MINICARGADOR',
      'MINI CARG': 'MINICARGADOR',
      'VQ SENC': 'VOLQUETA SENCILLA',
      'VQ SC': 'VOLQUETA SENCILLA',
      'VB': 'VIBROCOMPACTADOR',
      'VB 7T': 'VIBROCOMPACTADOR',
      'VB 10T': 'VIBROCOMPACTADOR',
      'BULL': 'BULLDOZER',
      'BULLD': 'BULLDOZER',
      'MT': 'MOTONIVELADORA',
      'CARROTANQUE': 'CARROTANQUE',
      'MARMITA': 'MARMITA',
      'CARGADOR': 'CARGADOR SOBRE RUEDAS',
      'CAMABAJA': 'CAMABAJA'
    };

    const invalidTokens = ['EQUIPO', 'EQUIPOS', 'MAQUINARIA', 'SUBREGION', 'MUNICIPIO', 'CTVO', 'INSPECTOR', 'OBSERVACION', 'OBSERVACIONES', 'ESTADO', 'DIAS', 'FECHA'];

    const startRow = Math.max(headerRowIdx + 1, categoryRowIdx + 1, 2);

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      const rowJoined = removeAccents(row.join(' ').toUpperCase());

      // Omitir automáticamente secciones de ZODMES, Disponibilidad, Stand By o Resúmenes
      if (rowJoined.includes('ZODME') || rowJoined.includes('DISPONIBILIDAD') || rowJoined.includes('STAND BY') || rowJoined.includes('RESUMEN GENERAL') || rowJoined.includes('TOTALES')) {
        continue;
      }

      // Cambio de tipo de actividad según cabeceras intermedias
      if (rowJoined.includes('EMERGENCIAS VIALES')) {
        currentActivityType = 'Emergencias Viales';
      } else if (rowJoined.includes('PUNTOS CRITICOS') || rowJoined.includes('APC')) {
        currentActivityType = 'Atención a Puntos Críticos';
      }

      // Actualizar Subregión
      if (row[subregionCol] && row[subregionCol].trim() !== '') {
        const subNorm = removeAccents(row[subregionCol].toUpperCase().trim());
        if (!subNorm.includes('SUBREGION') && !subNorm.includes('EMERGENCIAS') && !subNorm.includes('PUNTOS CRITICOS') && !subNorm.includes('APC')) {
          currentSubregion = row[subregionCol].trim();
        }
      }

      // Actualizar Municipio y Frente
      if (row[mpioCol] && row[mpioCol].trim() !== '') {
        currentMunicipio = row[mpioCol].trim();
      }
      if (row[frenteCol] && row[frenteCol].trim() !== '') {
        currentFrente = row[frenteCol].trim().replace(/[\r\n]+/g, ' ');
      }

      const key = currentMunicipio.toUpperCase() + " - " + currentFrente.toUpperCase();
      if (!frenteMetadata[key]) {
        frenteMetadata[key] = { estadoVia: '', avance: '', longitud: '', km: '', activityType: currentActivityType, subregion: currentSubregion };
      }

      // Extraer metadatos de la vía desde las columnas de observación
      const obsKey = (row[obsCol] || '').trim();
      const obsVal = (row[obsValCol] || '').trim();
      if (obsKey && obsVal) {
        const kLower = removeAccents(obsKey.toLowerCase());
        if (kLower.includes('estado via') || kLower.includes('estado de la via')) frenteMetadata[key].estadoVia = obsVal;
        else if (kLower.includes('avance anterior') || kLower.includes('sem anterior') || kLower.includes('semana anterior')) frenteMetadata[key].avanceAnteriorDirect = obsVal;
        else if (kLower.includes('avance')) frenteMetadata[key].avance = obsVal;
        else if (kLower.includes('longitud')) frenteMetadata[key].longitud = obsVal;
        else if (kLower.includes('km de atencion')) frenteMetadata[key].km = obsVal;
      }

      // Validar columna de equipo
      if (row.length <= equipoCol) continue;
      const equipoRaw = (row[equipoCol] || '').trim().toUpperCase();
      if (!equipoRaw || invalidTokens.includes(equipoRaw)) continue;
      if (invalidTokens.some(tok => equipoRaw.includes(tok))) continue;

      const isVarado = equipoRaw.includes('VARADA') || equipoRaw.includes('VARADO');
      const eqClean = equipoRaw.replace(/VARAD[AO]/g, '').trim();
      let equipo = knownMachines[equipoRaw] || knownMachines[eqClean] || eqClean;
      if (isVarado && !equipo.includes('VARAD')) equipo += ' (VARADA)';

      const serie = (row[serieCol] && row[serieCol].replace(/[^a-zA-Z0-9 -]/g, '').trim() !== '') 
        ? row[serieCol].replace(/[^a-zA-Z0-9 -]/g, '').trim() 
        : 'N/A';

      // Inspeccionar matriz de cantidades por propietario
      let foundMark = false;
      for (let c = firstMachineCol; c < row.length; c++) {
        const val = (row[c] || '').trim().toLowerCase();
        const parsedInt = parseInt(val, 10);
        const isMark = (val === '1' || val === 'x' || (!isNaN(parsedInt) && parsedInt > 0));

        if (isMark) {
          foundMark = true;
          const qty = (!isNaN(parsedInt) && parsedInt > 0) ? parsedInt : 1;
          let owner = 'Alquilado';
          if (gobIdx !== -1 && rentanIdx !== -1 && c >= gobIdx && c < rentanIdx) owner = 'Gobernación';
          else if (rentanIdx !== -1 && alqIdx !== -1 && c >= rentanIdx && c < alqIdx) owner = 'Rentan';
          else owner = 'Alquilado';

          for (let k = 0; k < qty; k++) {
            data.push({
              municipio: currentMunicipio,
              frente: currentFrente,
              tipo: equipo,
              placa: qty > 1 && serie !== 'N/A' ? `${serie} (${k + 1})` : serie,
              owner: owner,
              status: isVarado ? 'Varado' : 'Operativo'
            });
          }
          break; // Cada fila representa la asignación del equipo actual
        }
      }

      // Si la fila tiene un equipo explícito y placa/serie válida, pero el operador omitió marcar el '1' en la matriz
      if (!foundMark && serie !== 'N/A' && serie.length >= 3 && !invalidTokens.includes(equipoRaw)) {
        data.push({
          municipio: currentMunicipio,
          frente: currentFrente,
          tipo: equipo,
          placa: serie,
          owner: 'Alquilado', // Asignación por defecto cuando no se marcó en la matriz
          status: isVarado ? 'Varado' : 'Operativo'
        });
      }
    }

    if (data.length === 0) {
      let debugStr = "No se detectaron equipos operativos en la matriz.\nEstructura analizada:\n";
      for (let d = 0; d < Math.min(5, rows.length); d++) {
        debugStr += `Fila ${d}: [${rows[d][equipoCol] || 'Vacio'}] Cols: ${rows[d].length}\n`;
      }
      alert(debugStr + "\nPor favor verifique que la hoja seleccionada contenga los encabezados de Municipio, Frente, Equipo y las marcas (1 o X) en las columnas de maquinaria.");
      return;
    }

    const grouped = {};
    data.forEach(item => {
      const key = item.municipio.toUpperCase() + " - " + item.frente.toUpperCase();
      if (!grouped[key]) {
        const meta = frenteMetadata[key] || { estadoVia: '', avance: '', longitud: '', km: '', subregion: '' };
        const actVal = parseAvanceNum(meta.avance);
        let antVal = 0;
        if (meta.avanceAnteriorDirect) {
          antVal = parseAvanceNum(meta.avanceAnteriorDirect);
        } else if (previousProgressMap[key] !== undefined) {
          antVal = previousProgressMap[key];
        }
        const delta = actVal - antVal;
        meta.avanceActual = actVal;
        meta.avanceAnterior = antVal;
        meta.deltaSemanal = delta;
        if (!meta.avance || meta.avance === '') meta.avance = `${actVal}%`;

        grouped[key] = {
          id: window.AppHelpers.generateUUID(),
          municipality: item.municipio,
          name: item.frente,
          date: window.AppHelpers.getFormattedCurrentDate(),
          metadata: meta,
          activityType: frenteMetadata[key] ? frenteMetadata[key].activityType : 'Emergencias Viales',
          subregion: frenteMetadata[key] ? frenteMetadata[key].subregion : 'Desconocida',
          equipment: []
        };
      }
      grouped[key].equipment.push({
        type: item.tipo,
        plate: item.placa,
        owner: item.owner,
        status: item.status
      });
    });

    const frentesActivos = Object.values(grouped);
    
    // Contabilizar equipos por propietario y estado para resumen informativo
    const gobCount = data.filter(d => d.owner === 'Gobernación').length;
    const rentanCount = data.filter(d => d.owner === 'Rentan').length;
    const alqCount = data.filter(d => d.owner === 'Alquilado').length;
    const varadosCount = data.filter(d => d.status === 'Varado').length;

    const confirmMsg = 
`✅ Procesamiento exitoso del archivo:

• Frentes Activos detectados: ${frentesActivos.length}
• Total Maquinaria y Equipos: ${data.length}
   - Gobernación: ${gobCount}
   - Rentan: ${rentanCount}
   - Alquilados: ${alqCount}
${varadosCount > 0 ? `   - Equipos en Estado Varado: ${varadosCount}\n` : ''}
¿Deseas reemplazar la base de datos actual con estos frentes y equipos?`;

    if (confirm(confirmMsg)) {
      window.AppStore.updateState('frentesActivos', frentesActivos);
      
      // Descarga automática de respaldo JSON
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(frentesActivos, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `frentes_activos_${window.AppHelpers.getFormattedCurrentDate().replace(/[^a-zA-Z0-9]/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      window.AppModules.frentesActivos(document.getElementById('app-main'));
    }
  }


  function generateFrentesPDF(frentes) {
    const dateStr = window.AppHelpers.getFormattedCurrentDate();
    const now = new Date();
    const pad = num => String(num).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    const logoGober = 'img/logogober.png';
    const logoRentan = 'img/logorentan.png';
    const firma = 'img/firmaalexgomez.png';

    let totalFrentes = frentes.length;
    let totalEquipos = 0;
    let totalPropios = 0;
    let totalRentan = 0;
    let totalAlquilados = 0;
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
        else totalAlquilados++;
      });
      
      const activityType = f.metadata && f.metadata.activityType ? f.metadata.activityType : 'Emergencias Viales';
      if(typeStats[activityType] !== undefined) typeStats[activityType]++;
      else typeStats[activityType] = 1;
      
      const subregion = f.metadata && f.metadata.subregion && f.metadata.subregion !== 'Desconocida' ? f.metadata.subregion.toUpperCase() : 'NO ESPECIFICADA';
      if(subregionStats[subregion]) subregionStats[subregion]++;
      else subregionStats[subregion] = 1;

      const actVal = f.metadata && f.metadata.avanceActual !== undefined ? f.metadata.avanceActual : parseAvanceNum(f.metadata?.avance);
      const antVal = f.metadata && f.metadata.avanceAnterior !== undefined ? f.metadata.avanceAnterior : 0;
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
      const actVal = f.metadata && f.metadata.avanceActual !== undefined ? f.metadata.avanceActual : parseAvanceNum(f.metadata?.avance);
      const antVal = f.metadata && f.metadata.avanceAnterior !== undefined ? f.metadata.avanceAnterior : 0;
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
          <p><strong>Fecha de Emisión:</strong> ${dateStr}</p>
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
              
              const actVal = f.metadata && f.metadata.avanceActual !== undefined ? f.metadata.avanceActual : parseAvanceNum(f.metadata?.avance);
              const antVal = f.metadata && f.metadata.avanceAnterior !== undefined ? f.metadata.avanceAnterior : 0;
              const deltaVal = f.metadata && f.metadata.deltaSemanal !== undefined ? f.metadata.deltaSemanal : (actVal - antVal);
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
          <img src="${firma}" class="signature-img" onerror="this.style.display='none';" />
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
