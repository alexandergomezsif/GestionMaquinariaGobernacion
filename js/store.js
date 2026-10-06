/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Almacén de Datos Central Relacional (Single Source of Truth)
 */

window.AppStore = (function() {
  const INITIAL_STATE = {
    // 1. Inventario de Maquinaria Pesada
    inventario: [
      { id: 'eq-1', equipment: 'Motoniveladora 120K Caterpillar', brand: 'Caterpillar', model: '120K', serial: 'SZN01626', plate: 'W-01', municipality: 'San Pedro de Uraba', location: 'Centro de acopio', hourMeter: 13695, status: 'Operativo', lastServiceDate: '2026-06-15', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' },
      { id: 'eq-2', equipment: 'Motoniveladora 120K Caterpillar', brand: 'Caterpillar', model: '120K', serial: 'SZN01627', plate: 'W-02', municipality: 'Zaragosa', location: 'Centro de acopio', hourMeter: 12617, status: 'Operativo', lastServiceDate: '2026-05-20', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' },
      { id: 'eq-3', equipment: 'Motoniveladora 120K Caterpillar', brand: 'Caterpillar', model: '120K', serial: 'SZN01628', plate: 'W-03', municipality: 'Andes', location: 'Centro de acopio', hourMeter: 11098, status: 'Operativo', lastServiceDate: '2026-07-20', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' },
      { id: 'eq-4', equipment: 'Motoniveladora 120K Caterpillar', brand: 'Caterpillar', model: '120K', serial: 'MFG07553', plate: 'W-04', municipality: 'Betulia', location: 'Centro de acopio', hourMeter: 12971, status: 'Operativo', lastServiceDate: '2026-04-10', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' },
      { id: 'eq-5', equipment: 'Motoniveladora 120K Caterpillar', brand: 'Caterpillar', model: '120K', serial: 'MFG07537', plate: 'W-05', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 12894, status: 'Operativo', lastServiceDate: '2026-07-01', lastServiceDetails: 'N/A', notes: 'PENDIENTE DE SOLDADURA MINIMA EN EQUIPO DELANTERO' },
      { id: 'eq-6', equipment: 'Retrocargador 416E Caterpillar', brand: 'Caterpillar', model: '416E', serial: 'MFG07582', plate: 'RC-01', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 12389, status: 'Fuera de Servicio', inoperativeDate: '2026-01-23', lastServiceDate: '2026-05-30', lastServiceDetails: 'N/A', notes: 'Falla en sistema inyección combustible, desgaste masivo terminales dirección. Pendiente proveedor.' },
      { id: 'eq-7', equipment: 'Retrocargador 416E Caterpillar', brand: 'Caterpillar', model: '416E', serial: 'MFG07557', plate: 'RC-02', municipality: 'Venecia', location: 'Centro de acopio', hourMeter: 10868, status: 'Operativo', lastServiceDate: '2026-07-15', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' },
      { id: 'eq-8', equipment: 'Retrocargador B95B New Holland', brand: 'New Holland', model: 'B95B', serial: 'NEHH02054', plate: 'RC-03', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 8462, status: 'Fuera de Servicio', inoperativeDate: '2026-05-21', lastServiceDate: '2026-06-25', lastServiceDetails: 'N/A', notes: 'Falla en diferencial trasera por desprendimiento de canastilla rodamientos.' },
      { id: 'eq-9', equipment: 'Vibrocompactador Bomag', brand: 'Bomag', model: 'BW 211', serial: '101013', plate: 'VB-01', municipality: 'Zaragoza', location: 'Centro de acopio', hourMeter: 9860, status: 'Operativo', lastServiceDate: '2026-06-10', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' },
      { id: 'eq-10', equipment: 'Bulldozer D6K Caterpillar', brand: 'Caterpillar', model: 'D6K', serial: 'HFBH02702', plate: 'BD-01', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 10136, status: 'Fuera de Servicio', inoperativeDate: '2025-10-26', lastServiceDate: '2026-05-15', lastServiceDetails: 'N/A', notes: 'Pendiente entrega de computadora sistema hidráulico. ECM motor bloqueado.' },
      { id: 'eq-11', equipment: 'Excavadora Link-Belt 210X2', brand: 'Link-Belt', model: '210X2', serial: 'LBX2114', plate: 'EX-01', municipality: 'Concordia', location: 'Centro de acopio', hourMeter: 13045, status: 'Fuera de Servicio', inoperativeDate: '2026-05-22', lastServiceDate: '2026-07-05', lastServiceDetails: 'N/A', notes: 'Intervención en los 4 cilindros hidráulicos. Fugas severas. Pendiente proveedor.' },
      { id: 'eq-12', equipment: 'Volqueta Chevrolet FTR', brand: 'Chevrolet', model: 'FTR', serial: 'ODR260', plate: 'ODR260', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 200888, status: 'Operativo', lastServiceDate: '2026-06-20', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES MAYORES' },
      { id: 'eq-13', equipment: 'Camabaja International 7500', brand: 'International', model: '7500', serial: 'ODR254', plate: 'ODR254', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 243140, status: 'Operativo', lastServiceDate: '2026-04-20', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES MAYORES' },
      { id: 'eq-14', equipment: 'Camabaja International 7500', brand: 'International', model: '7500', serial: 'ODR255', plate: 'ODR255', municipality: 'Sabaneta', location: 'Taller Central', hourMeter: 197792, status: 'Operativo', lastServiceDate: '2026-07-22', lastServiceDetails: 'N/A', notes: 'SIN NOVEDADES' }
    ],

    // 1.5 Cronograma de Actividades (Agregadas desde calendario)
    cronograma: [],

    // 2. Órdenes de Trabajo de Mantenimiento
    mantenimientos: [],

    // 3. Agenda Diaria
    agenda: [],

    // 4. Informes Operativos y actas generadas
    informes: [],
    actasGeneradas: [],

    // 5. Obligaciones Contractuales (plantilla: reemplazar por las del contrato)
    obligaciones: [
      { id: 'obl-1', numero: 1, titulo: 'Supervisión Técnica Operativa', descripcion: 'Verificar el estado y rendimientos de la maquinaria pesada en los frentes de obra.', lastUpdate: '', progress: 0, notes: '' },
      { id: 'obl-2', numero: 2, titulo: 'Control de Horómetros', descripcion: 'Revisar y avalar las planillas de horas máquina.', lastUpdate: '', progress: 0, notes: '' },
      { id: 'obl-3', numero: 3, titulo: 'Elaboración de Informes Semanales', descripcion: 'Consolidar el avance operativo.', lastUpdate: '', progress: 0, notes: '' },
      { id: 'obl-4', numero: 4, titulo: 'Consolidado Mensual', descripcion: 'Generar el informe ejecutivo mensual.', lastUpdate: '', progress: 0, notes: '' },
      { id: 'obl-5', numero: 5, titulo: 'Gestión Documental', descripcion: 'Mantener expedientes técnicos de la flota.', lastUpdate: '', progress: 0, notes: '' },
      { id: 'obl-6', numero: 6, titulo: 'Atención de Emergencias', descripcion: 'Coordinar traslado de maquinaria ante derrumbes.', lastUpdate: '', progress: 0, notes: '' },
      { id: 'obl-7', numero: 7, titulo: 'Comité de Seguimiento', descripcion: 'Participar en comités técnicos semanales.', lastUpdate: '', progress: 0, notes: '' }
    ],

    // 6. Frentes Activos (Emergencias y Puntos Críticos) + histórico de importaciones
    frentesActivos: [],
    historialFrentes: [],

    // 7. Configuración del usuario
    config: {
      usuario: 'Alexander Gómez Avendaño',
      cargo: '',
      incluirFirma: false
    }
  };

  const SCHEMA_VERSION = 2;
  const LEGACY_LS_KEY = 'AppStoreState';
  const DB_NAME = 'GestionContratoDB';
  const DB_STORE = 'kv';
  const DB_KEY = 'state';
  const META_LS_KEY = 'app_meta';
  const MAX_HISTORIAL = 26; // ~6 meses de importaciones semanales

  const clone = obj => JSON.parse(JSON.stringify(obj));

  function withDefaults(data) {
    const merged = Object.assign(clone(INITIAL_STATE), data || {});
    merged.config = Object.assign(clone(INITIAL_STATE.config), (data && data.config) || {});
    return merged;
  }

  let currentState = clone(INITIAL_STATE);
  const listeners = [];
  let persistTimer = null;
  let lastPersistError = null;
  let storageMode = 'indexeddb';

  // ---------------------------------------------------------------
  // Metadatos ligeros (último guardado / último respaldo) en localStorage
  // ---------------------------------------------------------------
  function readMeta() {
    try { return JSON.parse(localStorage.getItem(META_LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeMeta(patch) {
    try { localStorage.setItem(META_LS_KEY, JSON.stringify(Object.assign(readMeta(), patch))); } catch (e) { /* metadatos no críticos */ }
  }

  // ---------------------------------------------------------------
  // IndexedDB (capacidad de cientos de MB; funciona abriendo el HTML localmente)
  // ---------------------------------------------------------------
  let dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('IndexedDB no disponible en este navegador')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('No se pudo abrir IndexedDB'));
      req.onblocked = () => reject(new Error('IndexedDB bloqueado por otra pestaña'));
    });
    return dbPromise;
  }
  function idbGet(key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }
  function idbSet(key, value) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transacción abortada'));
    }));
  }

  function readLegacyLocalStorage() {
    try {
      const saved = localStorage.getItem(LEGACY_LS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Estado previo en localStorage ilegible:', e);
      return null;
    }
  }

  function reportPersistError(err) {
    lastPersistError = err;
    console.error('Error guardando datos:', err);
    if (window.AppEventBus) window.AppEventBus.publish('PersistError', { message: err.message || String(err) });
    if (window.AppHelpers) {
      window.AppHelpers.toast('⚠️ No se pudieron guardar los cambios',
        'Exporte un respaldo JSON ahora (botón 💾) para no perder información. Detalle: ' + (err.message || err), 'danger', 0);
    }
  }

  function persistNow() {
    persistTimer = null;
    const payload = { schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), data: currentState };
    if (storageMode === 'indexeddb') {
      return idbSet(DB_KEY, clone(payload))
        .then(() => { lastPersistError = null; writeMeta({ lastSavedAt: payload.savedAt }); })
        .catch(reportPersistError);
    }
    try {
      localStorage.setItem(LEGACY_LS_KEY, JSON.stringify(currentState));
      lastPersistError = null;
      writeMeta({ lastSavedAt: payload.savedAt });
    } catch (err) {
      reportPersistError(err);
    }
    return Promise.resolve();
  }

  function schedulePersist() {
    writeMeta({ dirtySinceBackup: true });
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persistNow, 250);
  }

  // Guardar inmediatamente si se cierra la pestaña con cambios pendientes
  window.addEventListener('beforeunload', () => { if (persistTimer) { clearTimeout(persistTimer); persistNow(); } });

  /**
   * Carga inicial: IndexedDB → (migración) localStorage → estado inicial.
   */
  const ready = (async () => {
    try {
      const stored = await idbGet(DB_KEY);
      if (stored && stored.data) {
        currentState = withDefaults(stored.data);
        return { source: 'indexeddb' };
      }
      const legacy = readLegacyLocalStorage();
      if (legacy) {
        currentState = withDefaults(legacy);
        await persistNow(); // migración: se conserva también la copia de localStorage como respaldo
        return { source: 'migrado-localstorage' };
      }
      return { source: 'inicial' };
    } catch (err) {
      console.warn('IndexedDB no disponible; se usará localStorage (límite ~5 MB).', err);
      storageMode = 'localstorage';
      const legacy = readLegacyLocalStorage();
      if (legacy) currentState = withDefaults(legacy);
      return { source: 'localstorage', warning: err.message };
    }
  })();

  function notifySubscribers(topic, payload) {
    listeners.forEach(cb => {
      try { cb(currentState, topic, payload); } catch (err) { console.error('Error en suscriptor del store:', err); }
    });
    if (window.AppEventBus) {
      window.AppEventBus.publish(topic || 'StoreUpdated', payload || currentState);
    }
  }

  /**
   * Normaliza un respaldo importado. Acepta:
   *  - Respaldo completo antiguo (objeto con inventario, informes, ...)
   *  - Respaldo nuevo { schemaVersion, data: {...} }
   *  - Archivo de frentes descargado tras una importación (arreglo de frentes)
   */
  function normalizeBackup(parsed) {
    if (Array.isArray(parsed)) {
      const looksLikeFrentes = parsed.every(f => f && Array.isArray(f.equipment));
      if (!looksLikeFrentes) throw new Error('El arreglo no corresponde a un archivo de frentes activos.');
      return Object.assign(clone(currentState), { frentesActivos: parsed });
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('El archivo de respaldo no contiene un objeto válido.');
    const data = parsed.data && typeof parsed.data === 'object' && parsed.schemaVersion ? parsed.data : parsed;
    const requiredKeys = ['inventario', 'informes', 'agenda', 'mantenimientos'];
    for (const k of requiredKeys) {
      if (!Array.isArray(data[k])) throw new Error(`Estructura inválida en el respaldo. Falta el arreglo de datos: ${k}`);
    }
    return data;
  }

  return {
    ready,
    SCHEMA_VERSION,

    getState() {
      return currentState;
    },

    getStorageInfo() {
      const meta = readMeta();
      return {
        mode: storageMode,
        lastSavedAt: meta.lastSavedAt || null,
        lastBackupAt: meta.lastBackupAt || null,
        dirtySinceBackup: !!meta.dirtySinceBackup,
        lastError: lastPersistError ? (lastPersistError.message || String(lastPersistError)) : null
      };
    },

    getEquipmentById(id) {
      return (currentState.inventario || []).find(e => e.id === id);
    },

    getReportById(id) {
      return (currentState.informes || []).find(r => r.id === id);
    },

    getObligationById(id) {
      return (currentState.obligaciones || []).find(o => o.id === id);
    },

    /**
     * Cálculo Automático Dinámico de KPIs
     */
    getCalculatedKPIs() {
      const inventory = currentState.inventario || [];
      const realTotal = inventory.length;
      const totalEquip = realTotal || 1;
      const opEquip = inventory.filter(e => e.status === 'Operativo').length;
      const maintEquip = inventory.filter(e => e.status === 'En Mantenimiento').length;
      const outEquip = inventory.filter(e => e.status === 'Fuera de Servicio').length;

      const availabilityPct = ((opEquip / totalEquip) * 100).toFixed(1);
      const outOfServicePct = (((maintEquip + outEquip) / totalEquip) * 100).toFixed(1);

      const mts = currentState.mantenimientos || [];
      const completedMts = mts.filter(t => t.estado === 'Completado').length;
      const totalMts = mts.length || 1;
      const mtCompliancePct = mts.length ? ((completedMts / totalMts) * 100).toFixed(1) : '0';

      const reports = currentState.informes || [];
      const approvedReports = reports.filter(r => r.status === 'Aprobado' || r.status === 'Entregado').length;
      const totalReports = reports.length || 1;
      const reportCompliancePct = reports.length ? ((approvedReports / totalReports) * 100).toFixed(1) : '0';

      return {
        totalEquip: realTotal,
        opEquip,
        maintEquip,
        outEquip,
        availabilityPct: parseFloat(availabilityPct),
        outOfServicePct: parseFloat(outOfServicePct),
        totalMts: mts.length,
        completedMts,
        mtCompliancePct: parseFloat(mtCompliancePct),
        totalReports: reports.length,
        approvedReports,
        reportCompliancePct: parseFloat(reportCompliancePct)
      };
    },

    /**
     * Agregador Unificado de Eventos para el Calendario Dinámico
     */
    getUnifiedCalendarEvents() {
      const events = [];

      (currentState.agenda || []).forEach(a => {
        events.push({
          id: a.id,
          title: `💬 ${a.titulo}`,
          date: a.fecha,
          type: 'agenda',
          category: a.categoria,
          priority: a.priority,
          notes: a.notes
        });
      });

      (currentState.mantenimientos || []).forEach(t => {
        const desc = t.descripcion || '';
        events.push({
          id: t.id,
          title: `🛠️ MT: ${desc.length > 20 ? desc.substring(0, 20) + '…' : desc}`,
          date: t.fecha,
          type: 'tarea',
          priority: 'Media',
          notes: desc
        });
      });

      (currentState.informes || []).forEach(inf => {
        events.push({
          id: inf.id,
          title: `📊 Informe ${inf.tipo}: ${inf.titulo}`,
          date: inf.fechaLimite,
          type: inf.tipo === 'Mensual' ? 'informe-mensual' : 'informe-semanal'
        });
      });

      (currentState.cronograma || []).forEach(cro => {
        events.push({
          id: cro.id,
          title: `📌 ${cro.actividad}`,
          date: cro.fecha,
          type: 'cronograma',
          notes: cro.observaciones
        });
      });

      return events;
    },

    updateState(key, value, eventTopic = 'StoreUpdated') {
      currentState[key] = value;
      schedulePersist();
      notifySubscribers(eventTopic, { key, value });
    },

    /**
     * Guarda una foto de los frentes actuales en el histórico (antes de reemplazarlos).
     */
    archiveFrentesSnapshot(label) {
      const frentes = currentState.frentesActivos || [];
      if (frentes.length === 0) return;
      const historial = [{ id: window.AppHelpers.generateUUID(), fecha: window.AppHelpers.todayISO(), etiqueta: label || '', frentes: clone(frentes) }]
        .concat(currentState.historialFrentes || [])
        .slice(0, MAX_HISTORIAL);
      currentState.historialFrentes = historial;
      schedulePersist();
    },

    replaceState(newState) {
      const data = normalizeBackup(newState);
      currentState = withDefaults(clone(data));
      schedulePersist();
      notifySubscribers('StoreStateReplaced', currentState);
    },

    subscribe(callback) {
      listeners.push(callback);
    },

    /**
     * Fuerza el guardado inmediato (útil antes de exportar o cerrar).
     */
    flush() {
      if (persistTimer) clearTimeout(persistTimer);
      return persistNow();
    },

    exportJSONBackup() {
      const now = new Date();
      const pad = num => String(num).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const filename = `Respaldo_Operativo_${timestamp}.json`;

      const payload = { schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data: currentState };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      writeMeta({ lastBackupAt: now.toISOString(), dirtySinceBackup: false });
      if (window.AppEventBus) window.AppEventBus.publish('BackupExported', { filename });
    },

    importJSONBackup(jsonString) {
      try {
        const parsedData = JSON.parse(jsonString);
        this.replaceState(parsedData);
        return { success: true, message: 'Respaldo cargado y guardado correctamente.' };
      } catch (err) {
        return { success: false, message: `Error al procesar el respaldo: ${err.message}` };
      }
    }
  };
})();
