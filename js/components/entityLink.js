/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Componente Reutilizable de Enlaces Inteligentes Relacionales (Smart Entity Links)
 */

window.AppComponents = window.AppComponents || {};

window.AppComponents.renderEntityLink = function(type, id, textOverride) {
  if (!id) return '<span style="color: var(--text-muted); font-size: 0.8rem;">Sin Vincular</span>';

  let text = textOverride;
  let targetModule = '';
  let badgeClass = 'badge-info';
  let icon = '';

  if (type === 'contract') {
    const contract = window.AppStore.getContractById(id);
    text = text || (contract ? contract.number : id);
    targetModule = 'contratos';
    badgeClass = 'badge-neutral';
    icon = '📜';
  } else if (type === 'equipment') {
    const equipment = window.AppStore.getEquipmentById(id);
    text = text || (equipment ? `${equipment.equipment} (${equipment.serial})` : id);
    targetModule = 'inventario';
    badgeClass = 'badge-neutral';
    icon = '🚜';
  } else if (type === 'report') {
    const report = window.AppStore.getReportById(id);
    text = text || (report ? report.titulo : id);
    targetModule = 'informes';
    badgeClass = 'badge-info';
    icon = '📊';
  } else if (type === 'obligation') {
    const obligation = window.AppStore.getObligationById(id);
    text = text || (obligation ? `Obligación N° ${obligation.numero}` : id);
    targetModule = 'obligaciones';
    badgeClass = 'badge-warning';
    icon = '⚖️';
  }

  return `
    <span class="badge ${badgeClass} smart-entity-link" data-target-module="${targetModule}" data-entity-id="${id}" style="cursor: pointer; transition: transform 0.15s ease;" title="Haga clic para ir a ${targetModule}">
      ${icon} ${window.AppHelpers.escapeHTML(text)}
    </span>
  `;
};

// Delegación global de eventos para enlaces inteligentes
document.addEventListener('click', (e) => {
  const link = e.target.closest('.smart-entity-link');
  if (link) {
    const targetModule = link.getAttribute('data-target-module');
    if (targetModule && window.navigateToModule) {
      window.navigateToModule(targetModule);
    }
  }
});
