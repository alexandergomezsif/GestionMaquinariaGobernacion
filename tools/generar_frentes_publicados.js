/**
 * Genera js/data/frentesPublicados.js a partir del Excel semanal de frentes activos.
 * Esos datos quedan dentro de la aplicación publicada (GitHub Pages), así cualquier
 * persona que abra el enlace ve la semana publicada sin importar nada.
 *
 * Uso:
 *   node tools/generar_frentes_publicados.js "<archivo.xlsx>" <hoja> [hojaSemanaAnterior] [YYYY-MM-DD]
 * Ejemplo:
 *   node tools/generar_frentes_publicados.js "FentesActivos/FRENTES ACTIVOS SEMANAL LUNES 5 DE OCTUBRE 2026.xlsx" 5_Octubre 28_Septiembre 2026-10-05
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const [excel, hoja, hojaAnterior, versionArg] = process.argv.slice(2);
if (!excel || !hoja) {
  console.error('Uso: node tools/generar_frentes_publicados.js "<archivo.xlsx>" <hoja> [hojaSemanaAnterior] [YYYY-MM-DD]');
  process.exit(1);
}

const XLSX = require(path.join(ROOT, 'js/libs/xlsx.full.min.js'));
const window = {};
const ctx = vm.createContext({ window, console });
for (const rel of ['js/utils/helpers.js', 'js/modules/frentes/comun.js', 'js/modules/frentes/importador.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
}
const F = window.Frentes;

const wb = XLSX.read(fs.readFileSync(excel));
const csvDe = nombre => {
  const ws = wb.Sheets[nombre];
  if (!ws) { console.error(`La hoja "${nombre}" no existe. Hojas: ${wb.SheetNames.join(', ')}`); process.exit(1); }
  return XLSX.utils.sheet_to_csv(ws, { FS: ';' });
};

let previos = [];
if (hojaAnterior) {
  const rPrev = F.analizarCSV(csvDe(hojaAnterior), []);
  if (!rPrev.error) previos = rPrev.frentesActivos;
}
const r = F.analizarCSV(csvDe(hoja), previos);
if (r.error) { console.error(r.error); process.exit(1); }

const version = versionArg || new Date().toISOString().slice(0, 10);
const [y, m, d] = version.split('-').map(Number);
const fechaLegible = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const fechaCap = fechaLegible.charAt(0).toUpperCase() + fechaLegible.slice(1);

const frentes = JSON.parse(JSON.stringify(r.frentesActivos)).map((f, i) => ({
  ...f,
  id: `pub-${version}-${String(i + 1).padStart(2, '0')}`,
  date: fechaCap
}));

const publicado = {
  version,
  titulo: `Frentes activos — semana del ${fechaCap.toLowerCase()}`,
  fuente: path.basename(excel),
  hoja,
  hojaAnterior: hojaAnterior || null,
  generado: new Date().toISOString(),
  resumen: {
    frentes: r.summary.frentes,
    equipos: r.summary.total,
    gobernacion: r.summary.gob,
    rentan: r.summary.rentan,
    alquilados: r.summary.alq,
    sinClasificar: r.summary.sinClasificar,
    varados: r.summary.varados,
    sinMarca: r.summary.unmarked
  },
  frentes
};

const salida = path.join(ROOT, 'js/data/frentesPublicados.js');
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida,
  '/**\n * DATOS PUBLICADOS DE FRENTES ACTIVOS (generado por tools/generar_frentes_publicados.js; no editar a mano)\n' +
  ` * Fuente: ${publicado.fuente} — hoja ${hoja}${hojaAnterior ? ` (semana anterior: ${hojaAnterior})` : ''}\n */\n` +
  'window.FRENTES_PUBLICADOS = ' + JSON.stringify(publicado, null, 2) + ';\n', 'utf8');
console.log(`Generado ${path.relative(ROOT, salida)}: versión ${version}, ${frentes.length} frentes, ${r.summary.total} equipos ` +
  `(GOB ${r.summary.gob} / RNT ${r.summary.rentan} / ALQ ${r.summary.alq} / Sin clasificar ${r.summary.sinClasificar})`);
