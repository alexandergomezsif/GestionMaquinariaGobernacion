/**
 * Pruebas unitarias del importador de frentes (sin navegador).
 * Ejecutar:  node --test tests/importador.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function cargarApp() {
  const window = {};
  const ctx = vm.createContext({ window, console });
  for (const rel of ['js/utils/helpers.js', 'js/modules/frentes/comun.js', 'js/modules/frentes/importador.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  }
  return window;
}

const window = cargarApp();
const F = window.Frentes;

function contar(frentes) {
  const c = { frentes: frentes.length, equipos: 0, GOB: 0, RNT: 0, ALQ: 0, SC: 0 };
  frentes.forEach(f => f.equipment.forEach(e => {
    c.equipos++;
    c[window.AppHelpers.getEquipmentOwnerInfo(e.owner).key]++;
  }));
  return c;
}

test('parseAvanceNum solo acepta porcentajes explícitos', () => {
  const casos = {
    'm3 removidos_%': 0,
    'Km atendidos 3/4_75%': 75,
    'Km atendidos 6,7/7,2_93%': 93,
    '17 Km / 26 km  - 70%': 70,
    '8+300': 0,
    '1+000': 0,
    '65': 65,
    '': 0
  };
  for (const [entrada, esperado] of Object.entries(casos)) {
    assert.equal(F.parseAvanceNum(entrada), esperado, `entrada: "${entrada}"`);
  }
});

test('sin bloque ALQUILADOS, los equipos RENTAN no se cuentan como alquilados', () => {
  const csv = [
    'FRENTES;;;;;;;;;;;Equipos GOB;;Equipos RENTAN;;',
    'SUBREGION;CTVO;MUNICIPIO;VIA (CODIGO);F1;F2;DIAS;EQUIPO;SERIE;OBSERVACION;;MT;RT;MT;RT',
    'SUROESTE;1;ANDES;Via A;;;;MT;111;Avance:;50%;1;;;',
    ';;;;;;;RT;222;;;;;;1',
    ';;;;;;;MT;333;;;;;1;'
  ].join('\n');
  const r = F.analizarCSV(csv, []);
  assert.ok(!r.error, r.error);
  const owners = JSON.parse(JSON.stringify(r.frentesActivos[0].equipment.map(e => `${e.plate}:${e.owner}`)));
  assert.deepEqual(owners, ['111:Gobernación', '222:Rentan', '333:Rentan']);
  assert.equal(r.frentesActivos[0].metadata.avanceActual, 50);
});

test('equipo con placa sin marca queda "Sin clasificar" y se reporta', () => {
  const csv = [
    'FRENTES;;;;;;;;;;;Equipos GOB;;Equipos RENTAN;;Equipos ALQUILADOS;',
    'SUBREGION;CTVO;MUNICIPIO;VIA (CODIGO);F1;F2;DIAS;EQUIPO;SERIE;OBSERVACION;;MT;RT;MT;RT;VQ SC;VQ DT',
    'SUROESTE;2;JARDIN;Via B;;;;VQ SC;BCE 455;Avance:;m3 removidos_%;;;;;;',
    ';;;;;;;RT;4515;;;;;;;1;'
  ].join('\n');
  const r = F.analizarCSV(csv, []);
  assert.ok(!r.error, r.error);
  assert.equal(r.summary.sinClasificar, 1);
  assert.equal(r.summary.alq, 1);
  assert.equal(r.summary.unmarked.length, 1);
  assert.equal(r.frentesActivos[0].metadata.avanceActual, 0, 'la plantilla "m3 removidos_%" no es avance');
});

test('archivo sin datos devuelve error sin lanzar excepción', () => {
  assert.ok(F.analizarCSV('a;b\n', []).error);
});

test('avance anterior se toma de la importación previa (ignorando tildes y mayúsculas)', () => {
  const csv = [
    'FRENTES;;;;;;;;;;;Equipos GOB;;Equipos RENTAN;;Equipos ALQUILADOS;',
    'SUBREGION;CTVO;MUNICIPIO;VIA (CODIGO);F1;F2;DIAS;EQUIPO;SERIE;OBSERVACION;;MT;RT;MT;RT;VQ SC;VQ DT',
    'NORTE;1;CAMPAMENTO;Via Yé;;;;MT;1371;Avance:;60%;1;;;;;'
  ].join('\n');
  const previos = [{ municipality: 'Campamento', name: 'VIA YE', metadata: { avanceActual: 45 }, equipment: [] }];
  const r = F.analizarCSV(csv, previos);
  const m = r.frentesActivos[0].metadata;
  assert.equal(m.avanceAnterior, 45);
  assert.equal(m.deltaSemanal, 15);
});

// Prueba con el Excel real, si está en FentesActivos/ (esa carpeta no se versiona)
const excel = path.join(ROOT, 'FentesActivos', 'FRENTES ACTIVOS SEMANAL LUNES 5 DE OCTUBRE 2026.xlsx');
test('Excel real 5 de octubre: conteos iguales al conteo manual', { skip: !fs.existsSync(excel) && 'Excel no disponible' }, () => {
  const XLSX = require(path.join(ROOT, 'js/libs/xlsx.full.min.js'));
  const wb = XLSX.read(fs.readFileSync(excel), { type: 'buffer' });
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['5_Octubre'], { FS: ';' });
  const r = F.analizarCSV(csv, []);
  assert.ok(!r.error, r.error);
  assert.deepEqual(contar(r.frentesActivos), { frentes: 15, equipos: 64, GOB: 7, RNT: 19, ALQ: 36, SC: 2 });
  assert.equal(r.summary.varados, 3);
});
