/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo de Búsqueda Global en el Modelo Central
 */

window.AppSearch = {
  performGlobalSearch(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const state = window.AppStore.getState();
    const results = [];

    // 1. Buscar en Inventario
    (state.inventario || []).forEach(eq => {
      const text = `${eq.equipment} ${eq.brand} ${eq.model} ${eq.serial} ${eq.plate} ${eq.municipality} ${eq.location} ${eq.operator}`.toLowerCase();
      if (text.includes(q)) {
        results.push({
          module: 'Inventario',
          title: `${eq.equipment} - ${eq.brand} ${eq.model}`,
          subtitle: `Placa: ${eq.plate || 'N/A'} | Serie: ${eq.serial} | Mpio: ${eq.municipality}`,
          targetModule: 'inventario',
          id: eq.id
        });
      }
    });

    // 2. Buscar en Contratos
    (state.contratos || []).forEach(c => {
      const text = `${c.number} ${c.contractor} ${c.object} ${c.supervisor}`.toLowerCase();
      if (text.includes(q)) {
        results.push({
          module: 'Contratos',
          title: `Contrato N° ${c.number}`,
          subtitle: `Contratista: ${c.contractor} | Sup: ${c.supervisor}`,
          targetModule: 'contratos',
          id: c.id
        });
      }
    });

    // 3. Buscar en Informes
    (state.informes || []).forEach(inf => {
      const text = `${inf.titulo} ${inf.periodo} ${inf.tipo} ${inf.status} ${inf.notas || ''}`.toLowerCase();
      if (text.includes(q)) {
        results.push({
          module: 'Informes',
          title: inf.titulo,
          subtitle: `Tipo: ${inf.tipo} | Periodo: ${inf.periodo} | Estado: ${inf.status}`,
          targetModule: 'informes',
          id: inf.id
        });
      }
    });

    // 4. Buscar en Tareas
    (state.tareas || []).forEach(t => {
      const text = `${t.title} ${t.description} ${t.responsible} ${t.priority} ${t.status}`.toLowerCase();
      if (text.includes(q)) {
        results.push({
          module: 'Tareas',
          title: t.title,
          subtitle: `Responsable: ${t.responsible} | Prioridad: ${t.priority} | Estado: ${t.status}`,
          targetModule: 'tareas',
          id: t.id
        });
      }
    });

    // 5. Buscar en Agenda
    (state.agenda || []).forEach(a => {
      const text = `${a.titulo} ${a.categoria} ${a.priority} ${a.notes || ''}`.toLowerCase();
      if (text.includes(q)) {
        results.push({
          module: 'Agenda',
          title: a.titulo,
          subtitle: `Categoría: ${a.categoria} | Prioridad: ${a.priority}`,
          targetModule: 'agenda',
          id: a.id
        });
      }
    });

    // 6. Buscar en Recordatorios & Notas
    (state.recordatorios || []).forEach(r => {
      const text = `${r.title} ${r.content || ''}`.toLowerCase();
      if (text.includes(q)) {
        results.push({
          module: 'Recordatorios',
          title: r.title,
          subtitle: r.content || '',
          targetModule: 'recordatorios',
          id: r.id
        });
      }
    });

    return results;
  }
};
