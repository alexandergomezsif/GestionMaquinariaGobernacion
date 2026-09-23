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
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 1.25rem;">
                <strong style="color: #991b1b; display: block; margin-bottom: 4px;">⚠️ Verificación Importante del Archivo:</strong>
                <span style="color: #7f1d1d; font-size: 0.88rem;">Para evitar inconsistencias en el procesamiento de maquinaria y frentes, asegúrese de verificar en su archivo Excel (.xlsx / .csv):</span>
              </div>

              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; color: var(--text-primary);">
                <li style="display: flex; align-items: flex-start; gap: 10px; background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 1.1rem; color: #dc2626;">🚫</span>
                  <div>
                    <strong>Eliminar columna de Señalización:</strong><br/>
                    <span style="color: var(--text-secondary); font-size: 0.82rem;">Recuerde eliminar previamente la columna que contiene información de señalización.</span>
                  </div>
                </li>
                <li style="display: flex; align-items: flex-start; gap: 10px; background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 1.1rem; color: #dc2626;">🚫</span>
                  <div>
                    <strong>Eliminar filas debajo de Emergencias (ZODMES y demás):</strong><br/>
                    <span style="color: var(--text-secondary); font-size: 0.82rem;">Recuerde suprimir las filas situadas debajo de las emergencias que correspondan a ZODMES u otros conceptos no viales.</span>
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
            
            // Find the sheet that contains actual data (look for 'MUNICIPIO' or just pick the largest one)
            let targetSheetName = workbook.SheetNames[0];
            let maxRows = 0;
            
            for (let name of workbook.SheetNames) {
                const sheet = workbook.Sheets[name];
                const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
                const rowCount = range.e.r - range.s.r + 1;
                if (rowCount > maxRows) {
                    maxRows = rowCount;
                    targetSheetName = name;
                }
            }
            
            const worksheet = workbook.Sheets[targetSheetName];
            const csvText = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
            processCSVImport(csvText);
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

    document.getElementById('btn-export-frentes-pdf').addEventListener('click', () => {
      generateFrentesPDF(state.frentesActivos || []);
    });
  };


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
          
          ${frente.metadata && (frente.metadata.estadoVia || frente.metadata.avance || frente.metadata.longitud || frente.metadata.km) ? `
          <div style="background: #f8fafc; border-radius: 4px; padding: 8px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
            ${frente.metadata.estadoVia ? `<div style="margin-bottom:2px;"><strong>🛣️ Estado:</strong> ${window.AppHelpers.escapeHTML(frente.metadata.estadoVia)}</div>` : ''}
            ${frente.metadata.avance ? `<div style="margin-bottom:2px;"><strong>📈 Avance:</strong> ${window.AppHelpers.escapeHTML(frente.metadata.avance)}</div>` : ''}
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

    let gobIdx = -1, rentanIdx = -1, alqIdx = -1;
    for(let i=0; i<rows[0].length; i++){
       const h = rows[0][i].toUpperCase();
       if(h.includes('GOB')) gobIdx = i;
       if(h.includes('RENTAN')) rentanIdx = i;
       if(h.includes('ALQUILADOS')) alqIdx = i;
    }
    
    if(gobIdx === -1) gobIdx = 11;
    if(rentanIdx === -1) rentanIdx = 17;
    if(alqIdx === -1) alqIdx = 23;

    let currentMunicipio = 'Desconocido';
    let currentSubregion = 'Desconocida';
    let currentFrente = 'Punto Crítico';
    let currentActivityType = 'Emergencias Viales';
    const data = [];
    const frenteMetadata = {};
    
    // Pre-scan row 0 and 1 for activity type just in case it's in A1 or A2
    const removeAccents = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");
    for(let i=0; i<Math.min(2, rows.length); i++) {
       const r = rows[i];
       const cA = removeAccents((r[0] || '').toUpperCase());
       if (cA.includes('EMERGENCIAS VIALES')) currentActivityType = 'Emergencias Viales';
       else if (cA.includes('PUNTOS CRITICOS') || cA.includes('APC')) currentActivityType = 'Atención a Puntos Críticos';
    }

    for(let i=2; i<rows.length; i++) {
       const row = rows[i];
       
       const colA = (row[0] || '').toUpperCase();
       const colB = (row[1] || '').toUpperCase();
       const colC = (row[2] || '').toUpperCase();
       const colD = (row[3] || '').toUpperCase();
       
       const removeAccents = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");
       const colANorm = removeAccents(colA);
       const colBNorm = removeAccents(colB);
       const colCNorm = removeAccents(colC);
       const colDNorm = removeAccents(colD);

       if (colANorm.includes('EMERGENCIAS VIALES') || colBNorm.includes('EMERGENCIAS VIALES') || colCNorm.includes('EMERGENCIAS VIALES') || colDNorm.includes('EMERGENCIAS VIALES')) {
           currentActivityType = 'Emergencias Viales';
       } else if (colANorm.includes('PUNTOS CRITICOS') || colANorm.includes('APC') || colBNorm.includes('PUNTOS CRITICOS') || colCNorm.includes('PUNTOS CRITICOS') || colDNorm.includes('PUNTOS CRITICOS')) {
           currentActivityType = 'Atención a Puntos Críticos';
       }

       const isHeaderOrSection = colANorm.includes('EMERGENCIAS') || colANorm.includes('PUNTOS CRITICOS') || colANorm.includes('APC') || colANorm.includes('SUBREGION');
       if (!isHeaderOrSection && row[0] && row[0].trim() !== '') {
           currentSubregion = row[0].trim();
       }

       const municipio = row[2] ? row[2].trim() : '';
       const frente = row[3] ? row[3].trim() : '';

       if(municipio !== '') currentMunicipio = municipio;
       if(frente !== '') currentFrente = frente.replace(/[\r\n]+/g, ' '); 

       const key = currentMunicipio.toUpperCase() + " - " + currentFrente.toUpperCase();
       if(!frenteMetadata[key]) {
          frenteMetadata[key] = { estadoVia: '', avance: '', longitud: '', km: '', activityType: currentActivityType, subregion: currentSubregion };
       }

       const obsKey = (row[9] || '').trim();
       const obsVal = (row[10] || '').trim();
       if (obsKey && obsVal) {
           const kLower = obsKey.toLowerCase();
           if (kLower.includes('estado via') || kLower.includes('estado vía') || kLower.includes('estado de la via')) frenteMetadata[key].estadoVia = obsVal;
           else if (kLower.includes('avance')) frenteMetadata[key].avance = obsVal;
           else if (kLower.includes('longitud')) frenteMetadata[key].longitud = obsVal;
           else if (kLower.includes('km de atencion') || kLower.includes('km de atención')) frenteMetadata[key].km = obsVal;
       }

       if(row.length < 8) continue; 
       
       const equipoRaw = row[7];
       if(!equipoRaw || equipoRaw.replace(/[^a-zA-Z0-9 ]/g, '').trim() === '') continue; 
       
       let equipo = equipoRaw.trim().toUpperCase();
       if(equipo === 'RT') equipo = 'RETROEXCAVADORA';
       else if(equipo === 'VQ DT') equipo = 'VOLQUETA DOBLETROQUE';
       else if(equipo === 'EXC 13T') equipo = 'EXCAVADORA 13 TONELADAS';
       else if(equipo === 'EXC 20T') equipo = 'EXCAVADORA 20 TONELADAS';
       else if(equipo === 'MINI C' || equipo === 'MINI CARG') equipo = 'MINICARGADOR';
       else if(equipo === 'VQ SENC' || equipo === 'VQ SC') equipo = 'VOLQUETA SENCILLA';
       else if(equipo === 'VB' || equipo === 'VB 7T' || equipo === 'VB 10T') equipo = 'VIBROCOMPACTADOR';
       else if(equipo === 'BULL' || equipo === 'BULLD') equipo = 'BULLDOZER';
       else if(equipo === 'MT') equipo = 'MOTONIVELADORA';

       const serie = row[8] && row[8].replace(/[^a-zA-Z0-9 ]/g, '').trim() !== '' ? row[8].replace(/[^a-zA-Z0-9 ]/g, '').trim() : 'N/A';
       
       let owner = 'Alquilado'; 
       let count = 0;
       
       for(let c = 11; c < row.length; c++) {
          const val = row[c].trim().toLowerCase();
          const parsedInt = parseInt(val, 10);
          
          if(val === '1' || val === 'x' || (!isNaN(parsedInt) && parsedInt > 0)) {
             let qty = (!isNaN(parsedInt) && parsedInt > 0) ? parsedInt : 1;
             count += qty;
             if (gobIdx !== -1 && rentanIdx !== -1 && c >= gobIdx && c < rentanIdx) owner = 'Gobernación';
             else if (rentanIdx !== -1 && alqIdx !== -1 && c >= rentanIdx && c < alqIdx) owner = 'Rentan';
             else owner = 'Alquilado';
             
             for(let k=0; k<qty; k++) {
                 data.push({
                     municipio: currentMunicipio,
                     frente: currentFrente,
                     tipo: equipo,
                     placa: qty > 1 && serie !== 'N/A' ? `${serie} (${k+1})` : serie,
                     owner: owner,
                     status: 'Operativo'
                 });
             }
             break; 
          }
       }
       
       if (count === 0) {
           data.push({
               municipio: currentMunicipio,
               frente: currentFrente,
               tipo: equipo,
               placa: serie,
               owner: 'Alquilado',
               status: 'Operativo'
           });
       }
    }

    if(data.length === 0) {
      // Debug mode: show what the parser saw
      let debugStr = "No se detectaron equipos.\nEstructura leída:\n";
      for(let d=0; d<Math.min(5, rows.length); d++) {
         debugStr += `Fila ${d}: [${rows[d][7] || 'Vacio'}] Cols:${rows[d].length}\n`;
      }
      alert(debugStr + "\nPor favor asegúrate de que la columna H (8va columna) contenga el tipo de equipo, y que las cantidades estén desde la columna L (12va columna) en adelante.");
      return;
    }

    const grouped = {};
    data.forEach(item => {
      const key = item.municipio.toUpperCase() + " - " + item.frente.toUpperCase();
      if (!grouped[key]) {
        grouped[key] = {
          id: window.AppHelpers.generateUUID(),
          municipality: item.municipio,
          name: item.frente,
          date: window.AppHelpers.getFormattedCurrentDate(),
          metadata: frenteMetadata[key] || { estadoVia: '', avance: '', longitud: '', km: '', subregion: '' },
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
    
    if (confirm("Se han detectado " + frentesActivos.length + " frentes activos y " + data.length + " equipos. ¿Deseas reemplazar la base de datos actual?")) {
      window.AppStore.updateState('frentesActivos', frentesActivos);
      
      // Auto-download JSON backup
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(frentesActivos, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "frentes_activos.json");
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
    });
    
    // Sort subregions by count descending
    const sortedSubregions = Object.keys(subregionStats).sort((a, b) => subregionStats[b] - subregionStats[a]);


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
          
          .dashboard { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .dash-stat { text-align: center; }
          .dash-stat h4 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
          .dash-stat div { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 5px; }
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
          
          .progress-container { width: 100%; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 5px; height: 12px; position: relative; }
          .progress-bar { height: 100%; background: #16a34a; }
          .progress-text { position: absolute; width: 100%; text-align: center; font-size: 9px; font-weight: bold; color: #fff; top: 0; left: 0; line-height: 12px; text-shadow: 0px 0px 2px rgba(0,0,0,0.8); }
          .progress-text-dark { color: #334155; text-shadow: none; }

          .charts-container { display: flex; gap: 20px; margin-bottom: 25px; page-break-inside: avoid; }
          .chart-box { flex: 1; background: #fff; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; }
          .chart-title { font-size: 14px; font-weight: bold; color: #1e3a8a; margin-top: 0; margin-bottom: 15px; text-align: center; }
          
          .bar-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 11px; }
          .bar-label { width: 40%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; padding-right: 10px; }
          .bar-track { width: 60%; background: #e2e8f0; height: 14px; border-radius: 3px; overflow: hidden; position: relative; }
          .bar-fill { height: 100%; background: #0284c7; }
          .bar-value { position: absolute; right: 5px; top: 1px; font-weight: bold; color: #0f172a; font-size: 10px; }
          
          .signature-box { margin-top: 40px; page-break-inside: avoid; }
          .signature-img { width: 250px; max-height: 150px; object-fit: contain; margin-bottom: 0px; display: block; }
          
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
            <h4>Total Equipos en Terreno</h4>
            <div>${totalEquipos}</div>
          </div>
        </div>

        <div class="charts-container">
          <div class="chart-box">
            <h4 class="chart-title">Frentes por Tipo de Actividad</h4>
            <div style="display:flex; height: 30px; border-radius: 5px; overflow: hidden; margin-bottom: 10px; border: 1px solid #cbd5e1;">
               <div style="width: ${totalFrentes > 0 ? (typeStats['Emergencias Viales'] / totalFrentes) * 100 : 0}%; background: #dc2626; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold; overflow:hidden;" title="Emergencias">
                  ${typeStats['Emergencias Viales']}
               </div>
               <div style="width: ${totalFrentes > 0 ? (typeStats['Atención a Puntos Críticos'] / totalFrentes) * 100 : 0}%; background: #0284c7; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold; overflow:hidden;" title="APC">
                  ${typeStats['Atención a Puntos Críticos']}
               </div>
            </div>
            <div style="display:flex; justify-content:space-around; font-size:11px;">
              <div><span style="display:inline-block; width:10px; height:10px; background:#dc2626; border-radius:50%; margin-right:4px;"></span>Emergencias Viales (${typeStats['Emergencias Viales']})</div>
              <div><span style="display:inline-block; width:10px; height:10px; background:#0284c7; border-radius:50%; margin-right:4px;"></span>Atención P.C. (${typeStats['Atención a Puntos Críticos']})</div>
            </div>
          </div>
          
          <div class="chart-box">
            <h4 class="chart-title">Distribución por Subregión</h4>
            <div style="max-height: 120px; overflow: hidden;">
              ${sortedSubregions.slice(0, 5).map(sr => {
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
              ${sortedSubregions.length > 5 ? `<div style="text-align:center; font-size:10px; color:#64748b; margin-top:5px;">+${sortedSubregions.length - 5} subregiones más...</div>` : ''}
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
              
              // Parse progress percentage
              let progNum = 0;
              if (f.metadata && f.metadata.avance) {
                 const match = f.metadata.avance.match(/(\d+)(?:\s*%)/);
                 if (match) progNum = parseInt(match[1]);
                 else {
                   const match2 = f.metadata.avance.match(/(\d+)/);
                   if (match2 && parseInt(match2[1]) <= 100) progNum = parseInt(match2[1]);
                 }
              }
              const progColorClass = progNum > 30 ? 'progress-text' : 'progress-text progress-text-dark';
              
              let rows = `<tr class="frente-header">
                <td colspan="5">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                      📍 ${window.AppHelpers.escapeHTML(f.municipality)} - ${window.AppHelpers.escapeHTML(f.name)}<br/>
                      <span class="tag-activity ${actClass}">${window.AppHelpers.escapeHTML(actType)}</span>
                      <span class="tag-activity" style="background:#64748b; margin-left:5px;">${window.AppHelpers.escapeHTML(f.metadata?.subregion || 'Subregión N/E')}</span>
                    </div>
                    <div style="width: 120px;">
                      <div style="font-size:9px; text-align:center; color:#64748b; font-weight:normal; margin-bottom:2px;">Avance Reportado</div>
                      <div class="progress-container">
                        <div class="progress-bar" style="width: ${progNum}%;"></div>
                        <div class="${progColorClass}">${progNum}%</div>
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
