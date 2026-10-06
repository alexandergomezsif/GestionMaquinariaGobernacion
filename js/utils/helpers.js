/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Módulo de Funciones Auxiliares y Utilidades (Spanish Date & Number Formatting)
 */

window.AppHelpers = {
  /**
   * Retorna la fecha actual en formato legible en español.
   * Ej: "Jueves, 23 de Julio de 2026"
   */
  getFormattedCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatted = now.toLocaleDateString('es-CO', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  },

  /**
   * Fecha LOCAL en formato YYYY-MM-DD (no usar toISOString: devuelve UTC y en
   * Colombia (UTC-5) después de las 7 p.m. entrega la fecha del día siguiente).
   */
  todayISO(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  },

  /**
   * Hora LOCAL en formato HH:MM.
   */
  nowTime(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  /**
   * Fecha y hora LOCAL "YYYY-MM-DD HH:MM" (formato usado en agenda y bitácoras).
   */
  nowLocalDateTime(date = new Date()) {
    return `${this.todayISO(date)} ${this.nowTime(date)}`;
  },

  /**
   * Nombre del supervisor configurado (Configuración). Nunca lanza error.
   */
  getUserName() {
    const state = window.AppStore ? window.AppStore.getState() : null;
    return (state && state.config && state.config.usuario) || 'Supervisor del contrato';
  },

  /**
   * Bloque HTML de firma para documentos impresos. Solo inserta la imagen
   * escaneada si el usuario lo habilitó explícitamente en Configuración.
   */
  getSignatureHTML(imgStyle = 'max-height: 150px; display: block;') {
    const state = window.AppStore ? window.AppStore.getState() : null;
    const cfg = (state && state.config) || {};
    const name = this.escapeHTML(cfg.usuario || '');
    const cargo = this.escapeHTML(cfg.cargo || '');
    const img = cfg.incluirFirma
      ? `<img src="img/firmaalexgomez.png" style="${imgStyle}" onerror="this.style.display='none';" alt="Firma">`
      : '<div style="height: 60px;"></div>';
    return `
      ${img}
      <div style="border-top: 1px solid #000; width: 260px; padding-top: 4px; font-size: 12px;">
        <div style="font-weight: bold;">${name}</div>
        ${cargo ? `<div>${cargo}</div>` : ''}
      </div>`;
  },

  /**
   * Icono de tipo de actividad del frente (rutas literales para que bundle.py las incruste).
   */
  getActivityIcon(activityType) {
    return activityType === 'Emergencias Viales' ? 'img/icono-emergencias.png' : 'img/icono-puntos.png';
  },

  /**
   * Normaliza texto para comparaciones: mayúsculas, sin tildes, espacios simples.
   */
  normalizeKey(str) {
    return String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  },

  /**
   * Muestra una notificación breve en pantalla (no bloqueante).
   */
  toast(title, message = '', type = 'info', timeoutMs = 6000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `alert-item ${type} toast-item`;
    el.innerHTML = `<div class="alert-item-title">${this.escapeHTML(title)}</div>${message ? `<div class="alert-item-desc">${this.escapeHTML(message)}</div>` : ''}`;
    el.addEventListener('click', () => el.remove());
    container.appendChild(el);
    if (timeoutMs > 0) setTimeout(() => el.remove(), timeoutMs);
  },

  /**
   * Formatea una fecha ISO (YYYY-MM-DD) a formato corto en español (DD/MM/YYYY).
   */
  formatDateShort(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2].substring(0, 2)}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  },

  /**
   * Formatea un string de fecha u hora (YYYY-MM-DD HH:MM) a 12h (YYYY-MM-DD hh:mm AM/PM).
   */
  formatDateTime12h(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split(' ');
    if (parts.length === 1) return dateString; // Solo fecha

    const datePart = parts[0];
    const timePart = parts[1];
    
    let [hours, minutes] = timePart.split(':');
    hours = parseInt(hours, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // el 0 debe ser 12
    const strTime = (hours < 10 ? '0' + hours : hours) + ':' + minutes + ' ' + ampm;
    
    return `${datePart} ${strTime}`;
  },

  /**
   * Calcula el número de semana ISO del año.
   */
  getISOWeekNumber(date = new Date()) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.round((firstThursday - target) / 604800000);
  },

  /**
   * Calcula los días restantes del mes actual.
   */
  getRemainingDaysInMonth() {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDayOfMonth - now.getDate();
  },

  /**
   * Formatea un valor numérico como Moneda Pesos Colombianos (COP).
   */
  formatCOP(amount) {
    if (amount === undefined || amount === null) return '$ 0 COP';
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
    return `${formatted} COP`;
  },

  /**
   * Genera un ID único aleatorio.
   */
  generateUUID() {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  },

  /**
   * Sanitiza texto para inserción HTML segura.
   */
  escapeHTML(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Muestra un modal genérico con título y cuerpo HTML.
   */
  showModal(title, bodyHTML) {
    const modalHTML = `
      <div class="modal-overlay active" id="generic-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <div class="modal-title">${this.escapeHTML(title)}</div>
            <button class="modal-close" id="generic-modal-close">&times;</button>
          </div>
          <div class="modal-body" style="padding-top: 10px;">
            ${bodyHTML}
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('generic-modal');
    
    const closeModal = () => {
        modal.remove();
        document.removeEventListener('keydown', handleGlobalEsc);
    };

    const handleGlobalEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleGlobalEsc);

    document.getElementById('generic-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
  },
  
  /**
   * Retorna un icono SVG nativo basado en el tipo de equipo (maquinaria)
   */
  getEquipmentIcon(equipmentName, size = 18) {
    if (!equipmentName) return '';
    const name = equipmentName.toLowerCase();
    const style = `width: ${size}px; height: ${size}px; object-fit: contain; vertical-align: middle; margin-right: 6px;`;
    let src = 'img/icon-excavadora.png'; // default
    
    if (name.includes('bulldozer') || name.includes('tractor')) src = 'img/icon-bulldozer.png';
    else if (name.includes('camabaja') || name.includes('trailer')) src = 'img/icon-camabaja.png';
    else if (name.includes('dobletroque')) src = 'img/icon-volqueta-dobletroque.png';
    else if (name.includes('volqueta') || name.includes('dump')) src = 'img/icon-volqueta-sencilla.png';
    else if (name.includes('retroexcavadora')) src = 'img/icon-retroexcavadora.png';
    else if (name.includes('retrocargador') || name.includes('pajarita')) src = 'img/icon-retrocargador.png';
    else if (name.includes('minicargador')) src = 'img/icon-minicargador.png';
    else if (name.includes('excavadora')) src = 'img/icon-excavadora.png';
    else if (name.includes('motoniveladora') || name.includes('niveladora')) src = 'img/icon-motoniveladora.png';
    else if (name.includes('vibrocompactador') || name.includes('compactador') || name.includes('rodillo')) src = 'img/icon-vibrocompactador.png';
    
    return `<img src="${src}" style="${style}" title="${this.escapeHTML(equipmentName)}" alt="${this.escapeHTML(equipmentName)}">`;
  },

  /**
   * Centraliza la clasificación del propietario de un equipo (GOB / RNT / ALQ)
   * siguiendo el estándar DRY y asegurando coherencia en todos los módulos.
   */
  getEquipmentOwnerInfo(owner = '') {
    const o = String(owner || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (o === 'sin clasificar' || o === 'sc' || o === '') {
      return {
        key: 'SC',
        label: 'Sin clasificar',
        tagClass: 'tag-sc',
        color: '#64748b',
        hexColor: '#64748b',
        badgeClass: 'badge-neutral',
        isGob: false,
        isRentan: false,
        isAlquilado: false,
        isSinClasificar: true
      };
    }
    if (o.includes('gobernaci') || o.includes('propio') || o === 'gob') {
      return {
        key: 'GOB',
        label: 'Gobernación',
        tagClass: 'tag-gob',
        color: 'var(--primary-green, #16a34a)',
        hexColor: '#16a34a',
        badgeClass: 'badge-success',
        isGob: true,
        isRentan: false,
        isAlquilado: false
      };
    }
    if (o.includes('rentan') || o === 'rnt') {
      return {
        key: 'RNT',
        label: 'Rentan',
        tagClass: 'tag-rentan',
        color: 'var(--status-info, #0284c7)',
        hexColor: '#0284c7',
        badgeClass: 'badge-info',
        isGob: false,
        isRentan: true,
        isAlquilado: false
      };
    }
    return {
      key: 'ALQ',
      label: 'Alquilado',
      tagClass: 'tag-alq',
      color: '#f59e0b',
      hexColor: '#f59e0b',
      badgeClass: 'badge-warning',
      isGob: false,
      isRentan: false,
      isAlquilado: true
    };
  }
};

