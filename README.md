# Sistema de Gestión del Contrato — Maquinaria Amarilla

Aplicación local (HTML + JavaScript, sin servidor) para el seguimiento del contrato de
maquinaria con RENTAN — Secretaría de Infraestructura Física, Gobernación de Antioquia.

Estado: versión de pruebas. Se usa en el PC y publicada en GitHub Pages para pruebas y clientes.

## Uso

En línea (pruebas y clientes): `https://alexandergomezsif.github.io/GestionMaquinariaGobernacion/` (GitHub Pages; requiere que el repositorio sea público en el plan gratuito de GitHub). Cada navegador guarda sus propios datos.

En el PC:

1. Doble clic en `ABRIR_SISTEMA.bat` (abre `index.html` en el navegador predeterminado).
2. Los cambios se guardan solos en el navegador (IndexedDB).
3. Exporte un respaldo JSON con el botón 💾 al menos una vez por semana y guárdelo fuera del PC.

Use siempre el mismo navegador (Brave, Chrome o Edge): los datos viven en el navegador donde se crearon.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | Estructura de la aplicación |
| `js/store.js` | Estado único, guardado en IndexedDB, respaldo e importación JSON |
| `js/app.js` | Navegación, alertas, recordatorio de respaldo |
| `js/modules/` | Una pantalla por archivo (inventario, informes, agenda, …) |
| `js/modules/frentes/` | Frentes activos: importador del Excel, tarjetas, avance semanal, mapa, informe PDF |
| `js/utils/helpers.js` | Fechas locales, escape de HTML, propietario de equipos, firma |
| `css/` | Estilos |
| `bundle.py` | Genera `portable/GESTION_MAQUINARIA_PORTABLE.html` (copia en un solo archivo, no se versiona) |
| `GESTION MAQUINARIA 2026.html`, `index_bundle.html` | Redirigen a `index.html` para que los enlaces antiguos sigan funcionando |
| `tests/` | Pruebas unitarias del importador (Node) y pruebas en navegador (Playwright) |

## Pruebas

Pruebas unitarias del importador (solo requiere Node.js):

```
node --test tests/importador.test.js
```

Pruebas en navegador (requieren Python con Playwright: `pip install playwright` y `playwright install chromium`):

```
python tests/prueba_humo.py .
python tests/prueba_regresion.py .
```

Las pruebas usan un navegador temporal; no tocan los datos de su navegador.
`prueba_humo.py` importa el Excel que esté en `FentesActivos/` y reporta los conteos GOB / RNT / ALQ / Sin clasificar.

## Publicar cambios

`SUBIR_A_GITHUB.bat` genera el bundle local, muestra los archivos que se subirán, pide confirmación y mensaje, y hace push a la rama actual.
Nunca se suben: bundles, firma escaneada, hojas de vida, carpeta `FentesActivos/` ni respaldos JSON.
