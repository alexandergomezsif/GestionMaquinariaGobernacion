# Cambios

## v1.3 — 2026-10-06 (frentes publicados en la web)

- La aplicación trae incluidos los frentes activos de la semana del 5 de octubre de 2026 (hoja 5_Octubre; avance anterior desde 28_Septiembre): 15 frentes, 64 equipos (GOB 7 · RNT 19 · ALQ 36 · Sin clasificar 2).
- Al abrir el enlace de GitHub Pages, cualquier navegador carga esa semana sin importar el Excel. Si el navegador tenía datos más antiguos, se guardan en el histórico y se reemplazan.
- Una importación manual posterior tiene prioridad en ese navegador hasta que se publique una semana más reciente.
- La pantalla Frentes Activos indica el origen de los datos (publicados o importados).
- Nuevo `tools/generar_frentes_publicados.js` para generar `js/data/frentesPublicados.js` desde el Excel.

## v1.2.1 — 2026-10-06

- `GESTION MAQUINARIA 2026.html` e `index_bundle.html` vuelven al repositorio como páginas de redirección a `index.html`, para que los enlaces de GitHub Pages ya compartidos sigan funcionando.
- `bundle.py` genera la copia portable en `portable/GESTION_MAQUINARIA_PORTABLE.html` (no se versiona).

## v1.2 — 2026-10-06 (Fase 3: calidad y mantenibilidad)

Verificado: 6/6 pruebas unitarias del importador (`node --test tests/importador.test.js`), prueba de humo y de regresión en navegador sin errores, revisión automática sin variables indefinidas, y capturas en modo claro y oscuro.

### Estructura
- `js/modules/frentes.js` (1.659 líneas) se dividió en `js/modules/frentes/`: `comun.js`, `tarjeta.js`, `avanceSemanal.js`, `informePDF.js`, `mapa.js`, `importador.js`, `vista.js`.
- El análisis del Excel quedó como función pura (`Frentes.analizarCSV`), separada de la interfaz, con pruebas unitarias en Node que no requieren navegador.
- El cálculo de avance actual/anterior/variación, repetido en 6 lugares, quedó en una sola función (`Frentes.getAvance`).

### Código retirado
- Búsqueda global sin campo de búsqueda (`js/utils/search.js`), referencias a módulos inexistentes (contratos, tareas, recordatorios), `js/datos_app.json` sin uso, `html2pdf.bundle.min.js` (905 KB) nunca cargado, animación `ti-spin` sin uso.
- `LIMPIEZA_V1.2.bat` mueve esos archivos a `Backup\archivos_retirados_v1.2` (no los borra).

### Modo oscuro
- Títulos legibles (nueva variable `--text-heading`); fondos, bordes y textos fijos en blanco/gris de las pantallas y modales pasaron a variables del tema.
- Insignias, barras de progreso y notificaciones con contraste adecuado en oscuro.
- Los documentos impresos (PDF) mantienen fondo blanco a propósito.

## v1.1 — 2026-10-06

Verificado con `tests/prueba_humo.py` y `tests/prueba_regresion.py` (0 errores de consola) y con el Excel
"FRENTES ACTIVOS SEMANAL LUNES 5 DE OCTUBRE 2026" (hoja 5_Octubre): 15 frentes, 64 equipos,
GOB 7 · RNT 19 · ALQ 36 · Sin clasificar 2, igual al conteo hecho directamente sobre el Excel.

### Datos y guardado
- Guardado automático en IndexedDB (antes localStorage, ≈5 MB y fallaba en silencio). Migración automática de los datos existentes.
- Restaurar un respaldo ahora sí queda guardado (antes se perdía al recargar).
- Aviso visible si un guardado falla; recordatorio si hay cambios sin respaldo hace 7 días o más.
- Respaldo JSON con `schemaVersion`; también acepta los archivos `frentes_activos_*.json`.
- Histórico: cada importación guarda la semana anterior (hasta 26).
- Estado inicial sin registros ficticios (se conservan los 14 equipos del inventario).

### Importación de frentes
- Equipos sin marca de propietario quedan "Sin clasificar" y se listan en el resumen (antes se contaban como Alquilados).
- Si el Excel no trae el bloque ALQUILADOS, los equipos RENTAN ya no se cuentan como alquilados.
- El avance solo se toma de un porcentaje explícito: "m3 removidos_%" o abscisas como "8+300" ya no generan 3 % u 8 % ficticios.
- Resumen de importación en ventana propia con confirmación.

### Errores corregidos
- "Añadir novedad" en Inventario fallaba (`state.user` inexistente).
- Informes dejaba de cargar con "No aplica" (contratos inexistentes); se retiró esa columna.
- Fechas en UTC (después de las 7 p. m. se registraba el día siguiente).
- Fecha por defecto inválida en nuevas órdenes de mantenimiento.
- Editar una orden borraba el costo; editar un informe borraba las notas.
- "Aprobar" prometía actualizar obligaciones y KPIs que no actualizaba.
- Calendario fijo en 23-jul-2026; vistas Día y Semana ahora muestran eventos reales.
- Agenda permite elegir fecha.
- Buscadores de Inventario y Frentes ya no pierden el foco al escribir.
- Escape de HTML en calendario, alertas, búsqueda, mapa y modales.
- Mapa: búsquedas con caracteres especiales, marcadores se actualizan tras cada importación, listener de Escape duplicado.

### Firma y documentos
- La firma escaneada solo se inserta si se activa en Configuración (desactivada por defecto). Nombre y cargo configurables.

### Repositorio
- `bundle.py` y `export_code.py` usan la carpeta donde están (antes apuntaban a la copia de Antigravity).
- Bundles, firma y respaldos fuera de git (`.gitignore`); `SUBIR_A_GITHUB.bat` muestra lo que se sube y pide confirmación.
- `ABRIR_SISTEMA.bat` abre siempre `index.html`.
