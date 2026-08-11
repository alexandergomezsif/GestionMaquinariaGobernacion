/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo Evaluador de Alertas Operativas (Flota y Maquinaria)
 */

window.AppAlerts = {
  getSystemAlerts() {
    const state = window.AppStore.getState();
    const alerts = [];
    
    // Solo Alertas Operativas: Equipos Fuera de Servicio
    const outOfService = (state.inventario || []).filter(eq => eq.status === 'Fuera de Servicio' || eq.status === 'En Mantenimiento');
    
    outOfService.forEach(eq => {
      alerts.push({
        id: `alert-machinery-${eq.id}`,
        type: eq.status === 'Fuera de Servicio' ? 'danger' : 'warning',
        title: `Equipo Inoperativo: ${eq.equipment}`,
        description: `El equipo con placa/serie ${eq.plate || eq.serial} se encuentra en estado "${eq.status}". REVISAR y generar orden de trabajo si corresponde.`
      });
    });

    return alerts;
  }
};
