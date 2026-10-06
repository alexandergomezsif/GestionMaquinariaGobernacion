"""Pruebas específicas de regresión (migración, restauración, informes, calendario, CSV sin ALQ)."""
import sys, json, pathlib, tempfile
from playwright.sync_api import sync_playwright

app = pathlib.Path(sys.argv[1]).resolve()
res = {}
legacy = {
    'inventario': [{'id': 'eq-x', 'equipment': 'Retrocargador X', 'brand': 'B', 'model': 'M', 'serial': 'S1', 'plate': 'P', 'municipality': 'Andes', 'location': 'L', 'hourMeter': 10, 'status': 'Operativo'}],
    'informes': [{'id': 'inf-x', 'titulo': 'Informe heredado', 'tipo': 'Semanal', 'periodo': 'S1', 'fechaLimite': '2026-10-01', 'status': 'Pendiente', 'contractId': 'NO_APLICA', 'notas': 'nota previa'}],
    'agenda': [], 'mantenimientos': [{'id': 'mt-x', 'equipoId': 'eq-x', 'tipo': 'Correctivo', 'descripcion': 'Bomba', 'fecha': '2026-10-01', 'estado': 'Pendiente', 'responsable': 'Taller', 'costoEstimado': 4500000}],
}
csv_no_alq = "\n".join([
    "FRENTES;;;;;;;;;;;Equipos GOB;;Equipos RENTAN;;",
    "SUBREGION;CTVO;MUNICIPIO;VIA (CODIGO);F1;F2;DIAS;EQUIPO;SERIE;OBSERVACION;;MT;RT;MT;RT",
    "SUROESTE;1;ANDES;Via A;;;;MT;111;Avance:;50%;1;;;",
    ";;;;;;;RT;222;;;;;;1",
    ";;;;;;;MT;333;;;;;1;",
])

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context()
    ctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    url = app.joinpath('index.html').as_uri()
    # 1. Migración desde localStorage
    pg.goto(url)
    pg.evaluate("(s) => { localStorage.setItem('AppStoreState', JSON.stringify(s)); indexedDB.deleteDatabase('GestionContratoDB'); }", legacy)
    pg.reload(); pg.wait_for_timeout(1200)
    res['migracion_inventario'] = pg.evaluate("window.AppStore.getState().inventario.length")
    res['migracion_config_default'] = pg.evaluate("window.AppStore.getState().config.usuario")
    # 2. Informes con NO_APLICA y edición conserva notas
    pg.evaluate("window.navigateToModule('informes')"); pg.wait_for_timeout(200)
    res['informes_render'] = 'Informe heredado' in pg.inner_text('#app-main')
    pg.click('.btn-edit-report'); pg.wait_for_timeout(200)
    pg.click('#form-report button[type=submit]'); pg.wait_for_timeout(300)
    res['informe_conserva_notas'] = pg.evaluate("window.AppStore.getState().informes[0].notas")
    # 3. Editar mantenimiento conserva costo
    pg.evaluate("window.navigateToModule('mantenimientos')"); pg.wait_for_timeout(200)
    pg.click('.btn-edit-mt'); pg.wait_for_timeout(200)
    pg.click('#form-mt button[type=submit]'); pg.wait_for_timeout(300)
    res['mt_conserva_costo'] = pg.evaluate("window.AppStore.getState().mantenimientos[0].costoEstimado")
    pg.click('#btn-add-mt'); pg.wait_for_timeout(200)
    res['mt_fecha_defecto'] = pg.input_value('#mt-fecha')
    pg.click('#modal-cancel-btn')
    # 4. Calendario vistas
    pg.evaluate("window.navigateToModule('calendario')"); pg.wait_for_timeout(200)
    res['cal_titulo_mes'] = pg.inner_text('#calendar-header-title')
    res['cal_today_cells'] = pg.eval_on_selector_all('.calendar-cell.today', 'e => e.length')
    pg.click('#btn-view-weekly'); pg.wait_for_timeout(200)
    res['cal_semana'] = pg.inner_text('#calendar-header-title')
    pg.click('#btn-view-daily'); pg.wait_for_timeout(200)
    res['cal_dia'] = pg.inner_text('#calendar-header-title')
    # 5. Restaurar respaldo persiste tras recargar
    backup = json.dumps({'schemaVersion': 2, 'data': dict(legacy, inventario=[], agenda=[{'id': 'ag-r', 'titulo': 'Restaurado', 'categoria': 'Reunión', 'fecha': '2099-01-01 09:00', 'status': 'Pendiente'}])})
    res['restore'] = pg.evaluate("(j) => window.AppStore.importJSONBackup(j)", backup)
    pg.wait_for_timeout(600)
    pg.reload(); pg.wait_for_timeout(1200)
    res['restore_persiste'] = pg.evaluate("window.AppStore.getState().agenda.map(a => a.titulo)")
    # 6. CSV sin columna ALQUILADOS: RENTAN no debe quedar como Alquilado
    pg.evaluate("window.navigateToModule('frentesActivos')"); pg.wait_for_timeout(200)
    tmp = pathlib.Path(tempfile.gettempdir()) / 'prueba-sin-alq.csv'; tmp.write_text(csv_no_alq, encoding='utf-8')
    pg.set_input_files('#file-import-csv', str(tmp)); pg.wait_for_timeout(800)
    pg.click('#btn-confirm-import'); pg.wait_for_timeout(500)
    res['csv_no_alq'] = pg.evaluate("window.AppStore.getState().frentesActivos.flatMap(f => f.equipment.map(e => e.plate + ':' + e.owner))")
    res['historial'] = pg.evaluate("window.AppStore.getState().historialFrentes.length")
    # 7. Firma desactivada por defecto
    res['firma_default'] = pg.evaluate("window.AppStore.getState().config.incluirFirma")
    res['firma_html_sin_img'] = 'img' not in pg.evaluate("window.AppHelpers.getSignatureHTML()").split('<div')[0]
    # 8. Fecha local
    res['todayISO'] = pg.evaluate("window.AppHelpers.todayISO(new Date(2026, 9, 6, 22, 30))")
    res['errors'] = errors
    b.close()
print(json.dumps(res, ensure_ascii=False, indent=1))
