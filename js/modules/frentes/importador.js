/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Importación del Excel/CSV semanal de frentes activos
 */

window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;
  const parseAvanceNum = (v) => F.parseAvanceNum(v);

  /**
   * Conecta los controles de importación (botón, selector de archivo). Se llama en cada render.
   */
  F.bindImportador = function bindImportador() {
    // CSV / Excel Import handling with pre-import verification modal
    document.getElementById('btn-import-csv').addEventListener('click', () => {
      openImportInstructionModal();
    });

    function openImportInstructionModal() {
      const modalHTML = `
        <div class="modal-overlay active" id="modal-import-instructions">
          <div class="modal-content" style="max-width: 540px; background: var(--card-bg);">
            <div class="modal-header">
              <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.3rem;">📋</span> Recomendaciones previas a la Importación
              </div>
              <button type="button" class="modal-close" id="modal-close-import">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.25rem;">
              <div style="background: var(--status-success-bg); border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 4px; margin-bottom: 1.25rem;">
                <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">🚀 Motor de Detección Dinámica Inteligente:</strong>
                <span style="color: var(--text-primary); font-size: 0.88rem;">El sistema identifica automáticamente las columnas clave de su archivo Excel/CSV y asigna la maquinaria por propietario (Gobernación, Rentan, Alquilados).</span>
              </div>

              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; color: var(--text-primary);">
                <li style="display: flex; align-items: flex-start; gap: 10px; background: var(--bg-subtle); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--card-border);">
                  <span style="font-size: 1.1rem; color: #0284c7;">ℹ️</span>
                  <div>
                    <strong>Tolerancia de Columnas y Variaciones:</strong><br/>
                    <span style="color: var(--text-secondary); font-size: 0.82rem;">Si su archivo contiene columnas adicionales como Señalización, el motor las detectará y mantendrá intacta la asignación de equipos.</span>
                  </div>
                </li>
                <li style="display: flex; align-items: flex-start; gap: 10px; background: var(--bg-subtle); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--card-border);">
                  <span style="font-size: 1.1rem; color: #16a34a;">🛡️</span>
                  <div>
                    <strong>Filtrado Automático de ZODMES y Totales:</strong><br/>
                    <span style="color: var(--text-secondary); font-size: 0.82rem;">Las filas al final del reporte (ZODMES, Disponibilidad, Stand By o Resúmenes) son ignoradas automáticamente para evitar falsos positivos o frentes fantasma.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="modal-footer" style="background: var(--card-bg); border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.25rem;">
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
          processCSVImport(text, file.name);
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
        processCSVImport(csv, largest);
        return;
      }

      if (operationalSheets.length === 1) {
        // Solo hay 1 hoja de frentes: importar directamente
        const targetSheet = operationalSheets[0].name;
        const ws = workbook.Sheets[targetSheet];
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
        processCSVImport(csv, targetSheet);
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
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 2px solid ${isRec ? '#0284c7' : 'var(--card-border)'}; background: ${isRec ? '#f0f9ff' : 'white'}; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="radio" name="selected_sheet" value="${window.AppHelpers.escapeHTML(s.name)}" ${isRec ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #0284c7;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">${window.AppHelpers.escapeHTML(s.name)}</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${s.rowCount} filas de registro</span>
              </div>
            </div>
            ${isRec ? '<span style="background: #0284c7; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">✨ Recomendada</span>' : ''}
          </label>
        `;
      }).join('');

      const modalHTML = `
        <div class="modal-overlay active" id="${modalId}">
          <div class="modal-content" style="max-width: 520px; background: var(--card-bg); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <div class="modal-header" style="border-bottom: 1px solid var(--card-border); padding: 1.25rem;">
              <div class="modal-title" style="display:flex; align-items:center; gap:8px; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
                <span style="font-size:1.3rem;">📑</span> Seleccionar Semana / Hoja del Archivo
              </div>
              <button type="button" class="modal-close" id="modal-close-sheet-select">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.25rem;">
              <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0; margin-bottom: 1rem;">
                El archivo contiene reportes de varias semanas operativas. Seleccione la hoja que desea procesar:
              </p>
              <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
                ${optionsHtml}
              </div>
            </div>
            <div class="modal-footer" style="background: var(--bg-subtle); border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.25rem;">
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
        processCSVImport(csv, selectedName);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  };

  /**
   * Análisis puro (sin interfaz) de un CSV del reporte semanal.
   * @param {string} csvText Texto CSV (separador ; o ,)
   * @param {Array} existingFrentes Frentes actuales, para calcular el avance anterior
   * @returns {{error: string}|{frentesActivos: Array, summary: Object}}
   */
  function analizarCSV(csvText, existingFrentes) {
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
      return { error: "El archivo CSV no tiene suficientes datos." };
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
    let usedDefaultColumns = false;
    if (candidateCols.length > 0) {
      firstMachineCol = Math.min(...candidateCols);
    } else {
      firstMachineCol = Math.max(obsValCol + 1, 11);
      gobIdx = 11;
      rentanIdx = 17;
      alqIdx = 23;
      usedDefaultColumns = true;
    }

    // Bloques de propietario ordenados por columna: cada bloque va desde su
    // columna inicial hasta la siguiente detectada (o el final de la fila).
    const ownerBlocks = [
      { owner: 'Gobernación', start: gobIdx },
      { owner: 'Rentan', start: rentanIdx },
      { owner: 'Alquilado', start: alqIdx }
    ].filter(b => b.start !== -1).sort((a, b) => a.start - b.start);
    const ownerForColumn = (c) => {
      let found = null;
      for (const b of ownerBlocks) { if (c >= b.start) found = b.owner; }
      return found || 'Sin clasificar';
    };

    let currentMunicipio = 'Desconocido';
    let currentSubregion = 'Desconocida';
    let currentFrente = 'Punto Crítico';
    let currentActivityType = 'Emergencias Viales';
    const data = [];
    const unmarked = [];
    const frenteMetadata = {};

    // Pre-escaneo de actividad
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const rStr = removeAccents(rows[i].join(' ').toUpperCase());
      if (rStr.includes('EMERGENCIAS VIALES')) currentActivityType = 'Emergencias Viales';
      else if (rStr.includes('PUNTOS CRITICOS') || rStr.includes('APC')) currentActivityType = 'Atención a Puntos Críticos';
    }

    // Mapa de frentes previos para delta semanal automático
    existingFrentes = existingFrentes || [];
    const previousProgressMap = {};
    const normKey = window.AppHelpers.normalizeKey;
    existingFrentes.forEach(f => {
      const k = normKey(f.municipality) + " - " + normKey(f.name);
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
          const owner = ownerForColumn(c);

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
          owner: 'Sin clasificar', // No se marcó en la matriz: se reporta para revisión manual
          status: isVarado ? 'Varado' : 'Operativo'
        });
        unmarked.push(`${currentMunicipio} — ${equipo} (${serie})`);
      }
    }

    if (data.length === 0) {
      let debugStr = "No se detectaron equipos operativos en la matriz.\nEstructura analizada:\n";
      for (let d = 0; d < Math.min(5, rows.length); d++) {
        debugStr += `Fila ${d}: [${rows[d][equipoCol] || 'Vacio'}] Cols: ${rows[d].length}\n`;
      }
      return { error: debugStr + "\nPor favor verifique que la hoja seleccionada contenga los encabezados de Municipio, Frente, Equipo y las marcas (1 o X) en las columnas de maquinaria." };
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
        } else if (previousProgressMap[normKey(item.municipio) + " - " + normKey(item.frente)] !== undefined) {
          antVal = previousProgressMap[normKey(item.municipio) + " - " + normKey(item.frente)];
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
    const count = owner => data.filter(d => d.owner === owner).length;
    const summary = {
      frentes: frentesActivos.length,
      total: data.length,
      gob: count('Gobernación'),
      rentan: count('Rentan'),
      alq: count('Alquilado'),
      sinClasificar: count('Sin clasificar'),
      varados: data.filter(d => d.status === 'Varado').length,
      unmarked,
      usedDefaultColumns
    };

    return { frentesActivos, summary };
  }

  /**
   * Importa un CSV: analiza, muestra el resumen y, si se confirma, reemplaza los frentes.
   */
  function processCSVImport(csvText, sourceLabel) {
    const result = analizarCSV(csvText, window.AppStore.getState().frentesActivos || []);
    if (result.error) {
      alert(result.error);
      return;
    }
    const { frentesActivos, summary } = result;
    openImportSummaryModal(summary, () => {
      window.AppStore.archiveFrentesSnapshot('Antes de importar ' + (sourceLabel || 'archivo'));
      window.AppStore.updateState('frentesOrigen', { tipo: 'importado', version: window.AppHelpers.todayISO(), fuente: sourceLabel || '' });
      window.AppStore.updateState('frentesActivos', frentesActivos);

      // Descarga automática de respaldo JSON de los frentes importados
      const blob = new Blob([JSON.stringify(frentesActivos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.href = url;
      downloadAnchorNode.download = `frentes_activos_${window.AppHelpers.todayISO()}.json`;
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  /**
   * Modal con el resumen de la importación. Exige revisión antes de reemplazar los datos.
   */
  function openImportSummaryModal(summary, onConfirm) {
    const esc = str => window.AppHelpers.escapeHTML(str);
    const modalHTML = `
      <div class="modal-overlay active" id="modal-import-summary">
        <div class="modal-content" style="max-width: 560px; background: var(--card-bg);">
          <div class="modal-header">
            <div class="modal-title">✅ Resumen de la importación</div>
            <button type="button" class="modal-close" id="btn-close-import-summary">&times;</button>
          </div>
          <div class="modal-body">
            ${summary.usedDefaultColumns ? `<div class="import-warning">No se encontró la fila de categorías GOB / RENTAN / ALQUILADOS. Se usaron columnas por defecto: verifique los conteos contra el Excel.</div>` : ''}
            ${summary.sinClasificar > 0 ? `<div class="import-warning"><strong>${summary.sinClasificar} equipo(s) sin marca de propietario</strong> en la matriz. Quedarán como "Sin clasificar" hasta que corrija el Excel:<ul style="margin:6px 0 0 18px;">${summary.unmarked.map(u => `<li>${esc(u)}</li>`).join('')}</ul></div>` : ''}
            <table class="import-summary-table">
              <tr><td>Frentes activos detectados</td><td>${summary.frentes}</td></tr>
              <tr><td>Total maquinaria y equipos</td><td>${summary.total}</td></tr>
              <tr><td>&nbsp;&nbsp;Gobernación</td><td>${summary.gob}</td></tr>
              <tr><td>&nbsp;&nbsp;Rentan</td><td>${summary.rentan}</td></tr>
              <tr><td>&nbsp;&nbsp;Alquilados</td><td>${summary.alq}</td></tr>
              ${summary.sinClasificar > 0 ? `<tr><td>&nbsp;&nbsp;Sin clasificar</td><td>${summary.sinClasificar}</td></tr>` : ''}
              <tr><td>Equipos en estado Varado</td><td>${summary.varados}</td></tr>
            </table>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Al confirmar, los frentes actuales se guardan en el histórico y se reemplazan por los de este archivo.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-import-summary">Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-confirm-import">Confirmar y reemplazar</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('modal-import-summary');
    const close = () => modal.remove();
    document.getElementById('btn-close-import-summary').addEventListener('click', close);
    document.getElementById('btn-cancel-import-summary').addEventListener('click', close);
    document.getElementById('btn-confirm-import').addEventListener('click', () => {
      close();
      onConfirm();
    });
  }


  F.processCSVImport = processCSVImport;
  F.analizarCSV = analizarCSV;
})();
