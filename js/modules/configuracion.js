/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo 14: Configuración (Preferencia de Interfaz y Tema Visual)
 */

window.AppModules = window.AppModules || {};

window.AppModules.configuracion = function renderConfiguracionModule(container) {
  const currentTheme = localStorage.getItem('app_theme') || 'light';
  const currentFont = localStorage.getItem('app_font_size') || 'normal';

  container.innerHTML = `
    <div class="fade-in">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">Configuración de Interfaz</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Personalización visual y preferencias de visualización guardadas en el navegador.</p>
      </div>

      <div style="max-width: 600px; display: flex; flex-direction: column; gap: 1.25rem;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🎨 Tema Visual</div>
          </div>
          <div class="form-group">
            <label>Seleccione el modo de apariencia</label>
            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
              <button class="btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" id="btn-theme-light" style="flex: 1;">
                ☀️ Modo Claro Institucional
              </button>
              <button class="btn ${currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" id="btn-theme-dark" style="flex: 1;">
                🌙 Modo Oscuro Ejecutivo
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">🔤 Tamaño de Fuente</div>
          </div>
          <div class="form-group">
            <label>Ajuste el tamaño del texto para mayor legibilidad</label>
            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
              <button class="btn ${currentFont === 'small' ? 'btn-primary' : 'btn-secondary'}" id="btn-font-small" style="flex: 1;">Pequeño (12px)</button>
              <button class="btn ${currentFont === 'normal' ? 'btn-primary' : 'btn-secondary'}" id="btn-font-normal" style="flex: 1;">Normal (14px)</button>
              <button class="btn ${currentFont === 'large' ? 'btn-primary' : 'btn-secondary'}" id="btn-font-large" style="flex: 1;">Grande (16px)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-theme-light').addEventListener('click', () => {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('app_theme', 'light');
    renderConfiguracionModule(container);
  });

  document.getElementById('btn-theme-dark').addEventListener('click', () => {
    document.body.classList.add('dark-theme');
    localStorage.setItem('app_theme', 'dark');
    renderConfiguracionModule(container);
  });

  document.getElementById('btn-font-small').addEventListener('click', () => {
    document.body.classList.remove('font-large');
    document.body.classList.add('font-small');
    localStorage.setItem('app_font_size', 'small');
    renderConfiguracionModule(container);
  });

  document.getElementById('btn-font-normal').addEventListener('click', () => {
    document.body.classList.remove('font-small', 'font-large');
    localStorage.setItem('app_font_size', 'normal');
    renderConfiguracionModule(container);
  });

  document.getElementById('btn-font-large').addEventListener('click', () => {
    document.body.classList.remove('font-small');
    document.body.classList.add('font-large');
    localStorage.setItem('app_font_size', 'large');
    renderConfiguracionModule(container);
  });
};
