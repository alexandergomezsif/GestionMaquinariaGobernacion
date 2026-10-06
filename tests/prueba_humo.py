"""Headless regression harness for the Sistema de Gestión del Contrato.
Usage: python tests/prueba_humo.py . [label]
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

app = pathlib.Path(sys.argv[1]).resolve()
label = sys.argv[2] if len(sys.argv) > 2 else 'run'
xlsx = next((app / 'FentesActivos').glob('*.xlsx'))
MODULES = ['inicio', 'agenda', 'calendario', 'mantenimientos', 'inventario', 'informes',
           'frentesActivos', 'obligaciones', 'baseDatos', 'configuracion', 'acerca']

out = {'label': label, 'errors': [], 'dialogs': [], 'modules': {}}
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context()
    ctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: out['errors'].append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'ERR_FAILED' not in m.text and out['errors'].append('console: ' + m.text))
    def on_dialog(d):
        out['dialogs'].append({'type': d.type, 'msg': d.message[:600]})
        d.accept() if d.type != 'prompt' else d.accept('Prueba novedad')
    pg.on('dialog', on_dialog)
    pg.goto(app.joinpath('index.html').as_uri())
    pg.wait_for_timeout(800)
    for m in MODULES:
        pg.evaluate(f"window.navigateToModule('{m}')")
        pg.wait_for_timeout(250)
        out['modules'][m] = len(pg.inner_text('#app-main'))
    # Import Excel
    pg.evaluate("window.navigateToModule('frentesActivos')")
    pg.wait_for_timeout(200)
    pg.set_input_files('#file-import-csv', str(xlsx))
    pg.wait_for_timeout(1500)
    if pg.query_selector('#btn-confirm-sheet-select'):
        out['sheets'] = pg.eval_on_selector_all('input[name=selected_sheet]', 'els => els.map(e => e.value)')
        pg.click('#btn-confirm-sheet-select')
        pg.wait_for_timeout(1500)
    if pg.query_selector('#btn-confirm-import'):
        out['summary'] = pg.inner_text('#modal-import-summary')
        pg.click('#btn-confirm-import')
        pg.wait_for_timeout(800)
    out['frentes'] = pg.evaluate("""() => { const f = window.AppStore.getState().frentesActivos || [];
        const c = {frentes: f.length, equipos: 0, GOB: 0, RNT: 0, ALQ: 0, SC: 0};
        f.forEach(x => x.equipment.forEach(e => { c.equipos++; const k = window.AppHelpers.getEquipmentOwnerInfo(e.owner).key; c[k] = (c[k]||0) + 1; }));
        return c; }""")
    # Inventario: añadir novedad flow
    pg.evaluate("window.navigateToModule('inventario')")
    pg.wait_for_timeout(200)
    pg.click('.btn-edit-equip')
    pg.wait_for_timeout(200)
    pg.click('#btn-add-note')
    pg.wait_for_timeout(300)
    out['nota_ok'] = pg.query_selector('#notes-history-container') is not None and 'Prueba novedad' in pg.inner_text('#notes-history-container')
    pg.keyboard.press('Escape')
    # Persistence after reload
    pg.wait_for_timeout(500)
    pg.reload()
    pg.wait_for_timeout(1200)
    out['frentes_after_reload'] = pg.evaluate("(window.AppStore.getState().frentesActivos || []).length")
    b.close()
print(json.dumps(out, ensure_ascii=False, indent=1))
