/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo Principal de Inicialización y Enrutador SPA (Single Page Application)
 */

(function() {
  let currentActiveModule = localStorage.getItem('app_last_module') || 'inicio';

  document.addEventListener('DOMContentLoaded', () => {
    initPreferences();
    initSidebarNavigation();
    initGlobalSearch();
    initAlertDrawer();
    initToastNotifier();

    window.AppStore.subscribe(() => {
      updateAlertBadge();
      navigateToModule(currentActiveModule, false);
    });

    updateAlertBadge();
    navigateToModule(currentActiveModule);
  });

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

  function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const results = window.AppSearch.performGlobalSearch(query);
      showSearchResultsOverlay(results, query);
    });
  }

  function showSearchResultsOverlay(results, query) {
    let overlay = document.getElementById('search-overlay-dialog');
    if (!overlay) {
      const html = `
        <div class="modal-overlay active" id="search-overlay-dialog" style="z-index: 150;">
          <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
              <div class="modal-title">🔍 Resultados de Búsqueda Global</div>
              <button class="modal-close" id="search-close-btn">&times;</button>
            </div>
            <div class="modal-body" id="search-results-list" style="max-height: 400px; overflow-y: auto;">
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
      overlay = document.getElementById('search-overlay-dialog');

      document.getElementById('search-close-btn').addEventListener('click', () => {
        overlay.remove();
        document.getElementById('global-search-input').value = '';
      });
    }

    const listEl = document.getElementById('search-results-list');
    if (!listEl) return;

    if (!query || query.trim().length < 2) {
      overlay.remove();
      return;
    }

    if (results.length === 0) {
      listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No se encontraron coincidencias para "${query}".</p>`;
    } else {
      listEl.innerHTML = results.map(r => `
        <div class="search-result-item" data-module="${r.targetModule}" style="padding: 0.75rem; border-bottom: 1px solid var(--card-border); cursor: pointer;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="badge badge-info">${r.module}</span>
            <strong style="font-size: 0.9rem;">${r.title}</strong>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${r.subtitle}</div>
        </div>
      `).join('');

      listEl.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const targetModule = item.getAttribute('data-module');
          overlay.remove();
          document.getElementById('global-search-input').value = '';
          navigateToModule(targetModule);
        });
      });
    }
  }

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
          <div class="alert-item-title">${a.title}</div>
          <div class="alert-item-desc">${a.description}</div>
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

  function initToastNotifier() {
    // Show toasts for operational alerts every 5 minutes (300000ms)
    // Using 1 minute for demo purposes (60000ms)
    setInterval(() => {
      const alerts = window.AppAlerts.getSystemAlerts();
      if (alerts.length > 0) {
        // Just show the first one or a random one to avoid clutter
        const a = alerts[0];
        showToast(a.title, a.description, a.type);
      }
    }, 60000);
  }

  function showToast(title, message, type = 'danger') {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `alert-item ${type}`;
    toast.style.margin = '0 0 10px 0';
    toast.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    toast.style.animation = 'slideIn 0.3s ease-out forwards';
    toast.style.cursor = 'pointer';
    
    toast.innerHTML = `
      <div class="alert-item-title">${title}</div>
      <div class="alert-item-desc">${message}</div>
    `;
    
    // Auto-remove after 8 seconds
    const timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 8000);
    
    // Close on click
    toast.addEventListener('click', () => {
      clearTimeout(timeout);
      toast.remove();
    });
    
    container.appendChild(toast);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.width = '350px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    document.body.appendChild(container);
    return container;
  }
})();
