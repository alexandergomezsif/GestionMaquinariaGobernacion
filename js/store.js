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
    mantenimientos: [
      {
        id: 'mt-1',
        equipoId: 'eq-7',
        tipo: 'Correctivo',
        descripcion: 'Instalación de repuesto de bomba hidráulica importada',
        fecha: '2026-07-24',
        estado: 'En Proceso',
        responsable: 'Taller Central - Mecánico Juan Pérez',
        costoEstimado: 4500000
      },
      {
        id: 'mt-2',
        equipoId: 'eq-14',
        tipo: 'Preventivo',
        descripcion: 'Revisión y cambio de sistema neumático y válvulas de freno',
        fecha: '2026-07-23',
        estado: 'Pendiente',
        responsable: 'Taller Norte',
        costoEstimado: 1200000
      }
    ],

    // 3. Agenda Diaria
    agenda: [
      { id: 'ag-1', titulo: 'Comité Técnico Operativo', categoria: 'Reunión', priority: 'Alta', status: 'Pendiente', fecha: new Date().toISOString().split('T')[0], notes: 'Revisar estado de la flota de maquinaria.' },
      { id: 'ag-2', titulo: 'Inspección de Taller', categoria: 'Inspección', priority: 'Media', status: 'Pendiente', fecha: new Date().toISOString().split('T')[0], notes: 'Verificar avances en el retrocargador averiado.' }
    ],

    // 4. Informes Operativos
    informes: [
      { id: 'inf-1', titulo: 'Informe Operativo Semanal N° 29', tipo: 'Semanal', periodo: 'Semana 29 (14-20 Julio 2026)', fechaLimite: '2026-07-24', status: 'Aprobado', responsable: 'Alexander Gómez Avendaño', notas: 'Consolidado de operación.' },
      { id: 'inf-2', titulo: 'Informe Consolidado de Mantenimientos Julio', tipo: 'Mensual', periodo: 'Julio 2026', fechaLimite: '2026-08-03', status: 'Pendiente', responsable: 'Alexander Gómez Avendaño', notas: 'Borrador en construcción.' }
    ],

    // 5. 7 Obligaciones Contractuales (Nivel general operativo)
    obligaciones: [
      { id: 'obl-1', numero: 1, titulo: 'Supervisión Técnica Operativa', descripcion: 'Verificar el estado y rendimientos de la maquinaria pesada en los frentes de obra.', lastUpdate: '2026-07-22', progress: 85, notes: 'Visita de inspección realizada.' },
      { id: 'obl-2', numero: 2, titulo: 'Control de Horómetros', descripcion: 'Revisar y avalar las planillas de horas máquina.', lastUpdate: '2026-07-20', progress: 90, notes: 'Al día en la última semana.' },
      { id: 'obl-3', numero: 3, titulo: 'Elaboración de Informes Semanales', descripcion: 'Consolidar el avance operativo.', lastUpdate: '2026-07-21', progress: 100, notes: 'Entregados.' },
      { id: 'obl-4', numero: 4, titulo: 'Consolidado Mensual', descripcion: 'Generar el informe ejecutivo mensual.', lastUpdate: '2026-07-15', progress: 50, notes: 'En proceso de elaboración.' },
      { id: 'obl-5', numero: 5, titulo: 'Gestión Documental', descripcion: 'Mantener expedientes técnicos de la flota.', lastUpdate: '2026-07-19', progress: 100, notes: 'Sincronizado.' },
      { id: 'obl-6', numero: 6, titulo: 'Atención de Emergencias', descripcion: 'Coordinar traslado de maquinaria ante derrumbes.', lastUpdate: '2026-07-23', progress: 100, notes: 'Atención oportuna.' },
      { id: 'obl-7', numero: 7, titulo: 'Comité de Seguimiento', descripcion: 'Participar en comités técnicos semanales.', lastUpdate: '2026-07-21', progress: 100, notes: 'Acta firmada.' }
    ],

    // 6. Frentes Activos (Emergencias y Puntos Críticos)
    frentesActivos: []
  };

  let currentState = JSON.parse(JSON.stringify(INITIAL_STATE));
  const listeners = [];

  // Attempt to load from LocalStorage on startup
  try {
    const saved = localStorage.getItem('AppStoreState');
    if (saved) {
      const parsed = JSON.parse(saved);
      currentState = Object.assign({}, INITIAL_STATE, parsed);
    }
  } catch (e) {
    console.warn("LocalStorage no disponible o corrupto");
  }

  function notifySubscribers(topic, payload) {
    listeners.forEach(cb => cb(currentState, topic, payload));
    if (window.AppEventBus) {
      window.AppEventBus.publish(topic || 'StoreUpdated', payload || currentState);
    }
  }

  return {

    getState() {
      return currentState;
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
      const totalEquip = inventory.length || 1;
      const opEquip = inventory.filter(e => e.status === 'Operativo').length;
      const maintEquip = inventory.filter(e => e.status === 'En Mantenimiento').length;
      const outEquip = inventory.filter(e => e.status === 'Fuera de Servicio').length;

      const availabilityPct = ((opEquip / totalEquip) * 100).toFixed(1);
      const outOfServicePct = (((maintEquip + outEquip) / totalEquip) * 100).toFixed(1);

      const mts = currentState.mantenimientos || [];
      const completedMts = mts.filter(t => t.estado === 'Completado').length;
      const totalMts = mts.length || 1;
      const mtCompliancePct = ((completedMts / totalMts) * 100).toFixed(1);

      const reports = currentState.informes || [];
      const approvedReports = reports.filter(r => r.status === 'Aprobado' || r.status === 'Entregado').length;
      const totalReports = reports.length || 1;
      const reportCompliancePct = ((approvedReports / totalReports) * 100).toFixed(1);

      return {
        totalEquip,
        opEquip,
        maintEquip,
        outEquip,
        availabilityPct: parseFloat(availabilityPct),
        outOfServicePct: parseFloat(outOfServicePct),
        totalMts,
        completedMts,
        mtCompliancePct: parseFloat(mtCompliancePct),
        totalReports,
        approvedReports,
        reportCompliancePct: parseFloat(reportCompliancePct)
      };
    },

    /**
     * Agregador Unificado de Eventos para el Calendario Dinámico
     */
    getUnifiedCalendarEvents() {
      const events = [];

      // 1. Eventos de Agenda
      (currentState.agenda || []).forEach(a => {
        events.push({
          id: a.id,
          title: `💬 ${a.titulo}`,
          date: a.fecha, // Already has space separator if time is present
          type: 'agenda',
          category: a.categoria,
          priority: a.priority,
          notes: a.notes
        });
      });

      // 2. Mantenimientos
      (currentState.mantenimientos || []).forEach(t => {
        events.push({
          id: t.id,
          title: `🛠️ MT: ${t.descripcion.substring(0, 20)}...`,
          date: t.fecha,
          type: 'tarea',
          priority: 'Media'
        });
      });

      // 3. Entregas de Informes
      (currentState.informes || []).forEach(inf => {
        events.push({
          id: inf.id,
          title: `📊 Informe ${inf.tipo}: ${inf.titulo}`,
          date: inf.fechaLimite,
          type: inf.tipo === 'Mensual' ? 'informe-mensual' : 'informe-semanal'
        });
      });

      // 4. Actividades de Cronograma
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
      notifySubscribers(eventTopic, { key, value });
      try { localStorage.setItem('AppStoreState', JSON.stringify(currentState)); } catch(e) {}
    },

    replaceState(newState) {
      if (!newState || typeof newState !== 'object') {
        throw new Error('El archivo de respaldo no contiene un objeto válido.');
      }

      const requiredKeys = ['inventario', 'informes', 'agenda', 'mantenimientos'];
      for (const k of requiredKeys) {
        if (!Array.isArray(newState[k])) {
          throw new Error(`Estructura inválida en el respaldo. Falta el arreglo de datos: ${k}`);
        }
      }

      currentState = JSON.parse(JSON.stringify(newState));
      notifySubscribers('StoreStateReplaced', currentState);
    },

    subscribe(callback) {
      listeners.push(callback);
    },

    exportJSONBackup() {
      const now = new Date();
      const pad = num => String(num).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const filename = `Respaldo_Operativo_${timestamp}.json`;

      const jsonStr = JSON.stringify(currentState, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importJSONBackup(jsonString) {
      try {
        const parsedData = JSON.parse(jsonString);
        this.replaceState(parsedData);
        return { success: true, message: 'Respaldo cargado correctamente.' };
      } catch (err) {
        return { success: false, message: `Error al procesar el respaldo: ${err.message}` };
      }
    }
  };
})();
