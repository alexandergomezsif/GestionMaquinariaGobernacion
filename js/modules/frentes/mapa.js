/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Mapa de red vial (MapLibre + ArcGIS) y marcadores de frentes
 */

window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;
  const ARCGIS_BASE = F.ARCGIS_BASE;
  let escListenerRegistered = false;

  function loadActiveFrentesMarkers() {
    if (!window.frentesMap) return;
    (window.frentesMarkers || []).forEach(m => m.remove());
    window.frentesMarkers = [];
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
      const safe = code.replace(/'/g, "''");
      queries.push(`CODIGO_VIA LIKE '%${safe}%' OR NOMBRE_VIA LIKE '%${safe}%'`);
      frentesMapByCode[code] = f;
    });

    // ArcGIS often limits where clauses. We can batch them.
    // For safety, let's just do a big OR query. If it fails, it fails gracefully.
    const chunkSize = 15;
    for (let i = 0; i < queries.length; i += chunkSize) {
      const chunk = queries.slice(i, i + chunkSize);
      const whereClause = chunk.join(' OR ');
      
      [1, 2, 3].forEach(layerIdx => {
        const url = `${ARCGIS_BASE}/${layerIdx}/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=geojson`;
        
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
                const actIconSrc = window.AppHelpers.getActivityIcon(actType);
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
                el.innerHTML = `<img src="${actIconSrc}" style="width:22px; height:22px; object-fit:contain;" alt="Frente">`;

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
                        <img src="${actIconSrc}" style="width:14px; height:14px; margin-right:4px; object-fit:contain;" alt="Icon">
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

  /**
   * Conecta el botón "Ver Mapa" y el cierre del modal. Se llama en cada render.
   */
  F.bindMapa = function bindMapa() {
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
                  data: `${ARCGIS_BASE}/${conf.layerIdx}/query?where=1%3D1&outFields=*&f=geojson`
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
                        <h4 style="margin:0 0 5px;color:#1e3a8a;">${window.AppHelpers.escapeHTML(prop.NOMBRE_VIA || 'Sin nombre')}</h4>
                        <div><strong>Código:</strong> ${window.AppHelpers.escapeHTML(prop.CODIGO_VIA || '-')}</div>
                        <div><strong>Competente:</strong> ${window.AppHelpers.escapeHTML(prop.COMPETENTE || '-')}</div>
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
                    window.frentesMap.getSource(conf.id).setData(`${ARCGIS_BASE}/${conf.layerIdx}/query?where=1%3D1&outFields=*&f=geojson`);
                  });
                  return;
                }
                
                loading.style.display = 'block';
                const safeTerm = term.replace(/'/g, "''");
                const whereClause = encodeURIComponent(`NOMBRE_VIA LIKE '%${safeTerm}%' OR CODIGO_VIA LIKE '%${safeTerm}%'`);
                let loaded = 0;
                
                layersConfig.forEach(conf => {
                  const url = `${ARCGIS_BASE}/${conf.layerIdx}/query?where=${whereClause}&outFields=*&f=geojson`;
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

          } else if(window.frentesMap) {
            setTimeout(() => window.frentesMap.resize(), 100);
            if (window.frentesMap.loaded()) loadActiveFrentesMarkers();
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
      mapModalClose.onclick = closeMapModal;
    }
    
    // ESC key listener for map modal (registrado una sola vez)
    if (!escListenerRegistered) {
      escListenerRegistered = true;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modal = document.getElementById('map-modal');
          if (modal) modal.classList.remove('active');
        }
      });
    }
  };
})();
