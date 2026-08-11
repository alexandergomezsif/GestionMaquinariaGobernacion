/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 15: Acerca del Sistema (Información Institucional y Créditos)
 */

window.AppModules = window.AppModules || {};

window.AppModules.acerca = function renderAcercaModule(container) {
  container.innerHTML = `
    <div class="fade-in" style="max-width: 750px; margin: 0 auto;">
      <div class="card" style="text-align: center; padding: 2.5rem 2rem;">
        <div style="width: 70px; height: 75px; margin: 0 auto 1.5rem auto; background: var(--primary-subtle); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--primary-green); font-size: 2.5rem;">
          🏛️
        </div>

        <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.25rem;">
          GOBERNACIÓN DE ANTIOQUIA
        </h2>
        <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--primary-green); margin-bottom: 0.25rem;">
          Secretaría de Infraestructura Física
        </h3>
        <h4 style="font-size: 0.95rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 1.5rem;">
          Dirección de Desarrollo Físico
        </h4>

        <div style="background-color: var(--bg-light); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1.5rem; text-align: left;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
            Sistema de Gestión del Contrato v1.0 (Producción Offline)
          </h4>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.75rem;">
            Aplicación web de productividad personal diseñada de forma autónoma y fuera de línea para la administración diaria de la supervisión de contratos de obra publica, control de inventario de maquinaria pesada, planillas de horómetros, seguimiento a las 7 obligaciones contractuales, generación de informes semanales/mensuales y cálculo automático de indicadores de disponibilidad (KPIs).
          </p>
          <ul style="font-size: 0.85rem; color: var(--text-secondary); padding-left: 1.25rem; line-height: 1.5;">
            <li>Tecnología: HTML5, CSS3, ES6+ Vanilla JavaScript.</li>
            <li>Motor Gráfico: HTML5 Canvas Nativo.</li>
            <li>Modelo de Datos: In-Memory Central Store con persistencia mediante Respaldo JSON.</li>
            <li>Seguridad: 100% Offline sin conexión ni envío de datos a servidores externos.</li>
          </ul>
        </div>

        <div style="border-top: 1px solid var(--card-border); padding-top: 1.5rem;">
          <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
            Desarrollado y Diseñado por
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary-green); margin-top: 0.2rem;">
            Alexander Gómez Avendaño
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Supervisión y Desarrollo de Software Institucional
          </div>
        </div>
      </div>
    </div>
  `;
};
