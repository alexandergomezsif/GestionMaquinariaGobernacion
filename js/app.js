/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo Principal de Inicialización y Enrutador SPA (Single Page Application)
 */

(function() {
  let currentActiveModule = localStorage.getItem('app_last_module') || 'inicio';

  document.addEventListener('DOMContentLoaded', async () => {
    initPreferences();
    initSidebarNavigation();
    initAlertDrawer();
    initBackupButton();

    const mainContainer = document.getElementById('app-main');
    if (mainContainer) mainContainer.innerHTML = '<p style="padding:2rem;color:var(--text-muted);">Cargando datos…</p>';

    let loadInfo = { source: 'inicial' };
    try {
      loadInfo = await window.AppStore.ready;
    } catch (err) {
      console.error(err);
    }

    window.AppStore.subscribe(() => {
      updateAlertBadge();
      navigateToModule(currentActiveModule, false);
      updateBackupReminder();
    });

    updateAlertBadge();
    navigateToModule(currentActiveModule);
    updateBackupReminder();
    showStartupNotices(loadInfo);
  });

  function initBackupButton() {
    const btn = document.getElementById('btn-export-backup');
    if (btn) btn.addEventListener('click', () => {
      window.AppStore.exportJSONBackup();
      updateBackupReminder();
    });
  }

  /**
   * Banner persistente si hay cambios sin respaldar hace más de 7 días.
   */
  let reminderDismissed = false;
  function updateBackupReminder() {
    const info = window.AppStore.getStorageInfo();
    const days = info.lastBackupAt ? Math.floor((Date.now() - Date.parse(info.lastBackupAt)) / 86400000) : null;
    const needs = info.dirtySinceBackup && (days === null || days >= 7) && !reminderDismissed;
    let banner = document.getElementById('backup-reminder');
    if (!needs) { if (banner) banner.remove(); return; }
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'backup-reminder';
      banner.className = 'backup-reminder';
      document.body.appendChild(banner);
    }
    banner.innerHTML = `💾 ${days === null ? 'Aún no ha exportado ningún respaldo JSON.' : `Último respaldo hace ${days} días.`} Los datos viven solo en este navegador. <button class="btn btn-primary btn-sm" id="btn-backup-now">Exportar respaldo ahora</button><button class="reminder-close" id="btn-backup-dismiss" title="Ocultar por esta sesión">&times;</button>`;
    document.getElementById('btn-backup-dismiss').addEventListener('click', () => {
      reminderDismissed = true;
      banner.remove();
    });
    document.getElementById('btn-backup-now').addEventListener('click', () => {
      window.AppStore.exportJSONBackup();
      updateBackupReminder();
    });
  }

  function showStartupNotices(loadInfo) {
    if (loadInfo && loadInfo.source === 'migrado-localstorage') {
      window.AppHelpers.toast('Datos migrados', 'Sus datos se trasladaron a un almacenamiento más amplio (IndexedDB). Se recomienda exportar un respaldo.', 'info', 10000);
    }
    if (loadInfo && loadInfo.source === 'localstorage') {
      window.AppHelpers.toast('Almacenamiento limitado', 'Este navegador no permite IndexedDB; se usa localStorage (≈5 MB). Exporte respaldos con frecuencia.', 'warning', 0);
    }
    const alerts = window.AppAlerts.getSystemAlerts();
    if (alerts.length > 0) {
      window.AppHelpers.toast(`${alerts.length} equipo(s) inoperativo(s)`, 'Ver el detalle en la campana de alertas.', 'warning', 8000);
    }
  }

  function initPreferences() {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }

    const savedFont = localStorage.getItem('app_font_size');
    if (savedFont === 'small') document.body.classList.add('font-small');
    if (savedFont === 'large') document.body.classList.add('font-large');

    const sidebarCollapsed = localStorage.getItem('app_sidebar_collapsed') === 'true';
    const appContainer = document.getElementById('app-container');
    if (sidebarCollapsed && appContainer) {
      appContainer.classList.add('sidebar-collapsed');
    }
  }

  function initSidebarNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetModule = link.getAttribute('data-module');
        if (targetModule) {
          navigateToModule(targetModule);
        }
      });
    });

    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const appContainer = document.getElementById('app-container');
        appContainer.classList.toggle('sidebar-collapsed');
        const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
        localStorage.setItem('app_sidebar_collapsed', isCollapsed.toString());
      });
    }
  }

  function navigateToModule(moduleKey, updateStorage = true) {
    const renderFn = window.AppModules && window.AppModules[moduleKey];
    if (!renderFn) {
      console.warn(`Módulo ${moduleKey} no encontrado.`);
      return;
    }

    currentActiveModule = moduleKey;
    if (updateStorage) {
      localStorage.setItem('app_last_module', moduleKey);
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-module') === moduleKey) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const mainContainer = document.getElementById('app-main');
    if (mainContainer) {
      mainContainer.innerHTML = '';
      renderFn(mainContainer);
      mainContainer.scrollTop = 0;
    }
  }

  window.navigateToModule = navigateToModule;

  function initAlertDrawer() {
    const alertBtn = document.getElementById('btn-header-alerts');
    const drawer = document.getElementById('alert-drawer-panel');
    if (!alertBtn || !drawer) return;

    alertBtn.addEventListener('click', () => {
      drawer.classList.toggle('active');
      renderAlertsList();
    });
  }

  function renderAlertsList() {
    const listContainer = document.getElementById('drawer-alerts-content');
    if (!listContainer) return;
    const alerts = window.AppAlerts.getSystemAlerts();

    if (alerts.length === 0) {
      listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No hay alertas críticas en el sistema.</p>';
    } else {
      listContainer.innerHTML = alerts.map(a => `
        <div class="alert-item ${a.type}">
          <div class="alert-item-title">${window.AppHelpers.escapeHTML(a.title)}</div>
          <div class="alert-item-desc">${window.AppHelpers.escapeHTML(a.description)}</div>
        </div>
      `).join('');
    }
  }

  function updateAlertBadge() {
    const badge = document.getElementById('header-alert-badge');
    if (!badge) return;
    const alerts = window.AppAlerts.getSystemAlerts();
    if (alerts.length > 0) {
      badge.style.display = 'flex';
      badge.textContent = alerts.length.toString();
    } else {
      badge.style.display = 'none';
    }
  }

})();
