/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - Frentes Activos
 * Utilidades compartidas del módulo de frentes
 */

window.Frentes = window.Frentes || {};

(function() {
  const F = window.Frentes;

  F.ARCGIS_BASE = 'https://services5.arcgis.com/K90UQIB09TmTjUL8/arcgis/rest/services/R10/FeatureServer';

  /**
   * Extrae de forma segura el porcentaje numérico (0 - 100) de un string o valor
   */
  F.parseAvanceNum = function parseAvanceNum(val) {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return Math.min(100, Math.max(0, Math.round(val)));
    const str = String(val).trim();
    // Solo se acepta un porcentaje explícito ("75%", "Km 3/4_75%", "- 70 %").
    // Textos de plantilla como "m3 removidos_%" o abscisas como "8+300" NO son avance.
    const m = str.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (m) return Math.min(100, Math.max(0, Math.round(parseFloat(m[1].replace(',', '.')))));
    // Un número solo (p. ej. "65") se interpreta como porcentaje
    if (/^\d+(?:[.,]\d+)?$/.test(str)) {
      const num = parseFloat(str.replace(',', '.'));
      if (num <= 100) return Math.round(num);
    }
    return 0;
  };

  /**
   * Avance actual, anterior y variación semanal de un frente.
   */
  F.getAvance = function getAvance(frente) {
    const meta = (frente && frente.metadata) || {};
    const act = meta.avanceActual !== undefined ? meta.avanceActual : F.parseAvanceNum(meta.avance);
    const ant = meta.avanceAnterior !== undefined ? meta.avanceAnterior : 0;
    const delta = meta.deltaSemanal !== undefined ? meta.deltaSemanal : (act - ant);
    return { act, ant, delta };
  };

  /**
   * Clase CSS y signo para mostrar una variación semanal.
   */
  F.deltaBadge = function deltaBadge(delta) {
    return {
      cls: delta > 0 ? 'badge-delta-pos' : (delta < 0 ? 'badge-delta-neg' : 'badge-delta-zero'),
      sign: delta > 0 ? '+' : ''
    };
  };
})();
