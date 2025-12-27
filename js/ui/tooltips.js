/* ==============================================
   ELANIA RPG - Système de Tooltips
   ============================================== */

let activeTooltip = null;
let tooltipTimeout = null;

/**
 * Crée le conteneur de tooltip
 */
function initTooltipContainer() {
  if (document.getElementById('tooltip-container')) return;

  const container = document.createElement('div');
  container.id = 'tooltip-container';
  container.className = 'tooltip';
  container.innerHTML = `
    <div class="tooltip-title" id="tooltip-title"></div>
    <div class="tooltip-content" id="tooltip-content"></div>
  `;
  document.body.appendChild(container);
}

/**
 * Affiche un tooltip pour un item
 * @param {Object} item - L'item
 * @param {MouseEvent} event - L'événement souris
 */
function showItemTooltip(item, event) {
  initTooltipContainer();

  const tooltip = document.getElementById('tooltip-container');
  const rarity = RARITIES[item.rarity];

  // Titre
  document.getElementById('tooltip-title').textContent = item.name;
  document.getElementById('tooltip-title').style.color = rarity.color;

  // Contenu
  let content = `
    <div style="color: ${rarity.color}; margin-bottom: 0.5rem;">${rarity.name}</div>
    <div style="color: var(--text-muted); margin-bottom: 0.5rem;">
      ${EQUIPMENT_SLOTS[item.slot]?.name || item.slot} - Niveau ${item.levelRequired || 1}
    </div>
    <div class="tooltip-stats">
  `;

  formatItemStats(item).forEach(stat => {
    content += `<div style="color: var(--success);">${stat}</div>`;
  });

  content += '</div>';

  if (item.setId && EQUIPMENT_SETS[item.setId]) {
    content += `
      <div style="margin-top: 0.5rem; color: var(--rarity-uncommon);">
        Set: ${EQUIPMENT_SETS[item.setId].name}
      </div>
    `;
  }

  document.getElementById('tooltip-content').innerHTML = content;

  // Positionner
  positionTooltip(tooltip, event);

  tooltip.classList.add('visible');
  activeTooltip = tooltip;
}

/**
 * Affiche un tooltip générique
 * @param {string} title - Titre
 * @param {string} content - Contenu HTML
 * @param {MouseEvent} event - L'événement souris
 */
function showTooltip(title, content, event) {
  initTooltipContainer();

  const tooltip = document.getElementById('tooltip-container');

  document.getElementById('tooltip-title').textContent = title;
  document.getElementById('tooltip-title').style.color = 'var(--accent-gold)';
  document.getElementById('tooltip-content').innerHTML = content;

  positionTooltip(tooltip, event);

  tooltip.classList.add('visible');
  activeTooltip = tooltip;
}

/**
 * Positionne le tooltip près du curseur
 * @param {HTMLElement} tooltip - L'élément tooltip
 * @param {MouseEvent} event - L'événement souris
 */
function positionTooltip(tooltip, event) {
  const padding = 15;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Position initiale (à droite du curseur)
  let x = event.clientX + padding;
  let y = event.clientY + padding;

  // Obtenir les dimensions du tooltip
  tooltip.style.visibility = 'hidden';
  tooltip.style.display = 'block';
  const tooltipRect = tooltip.getBoundingClientRect();
  tooltip.style.visibility = '';

  // Ajuster si déborde à droite
  if (x + tooltipRect.width > viewportWidth - padding) {
    x = event.clientX - tooltipRect.width - padding;
  }

  // Ajuster si déborde en bas
  if (y + tooltipRect.height > viewportHeight - padding) {
    y = event.clientY - tooltipRect.height - padding;
  }

  // S'assurer que le tooltip reste dans le viewport
  x = Math.max(padding, Math.min(x, viewportWidth - tooltipRect.width - padding));
  y = Math.max(padding, Math.min(y, viewportHeight - tooltipRect.height - padding));

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

/**
 * Cache le tooltip
 */
function hideTooltip() {
  if (activeTooltip) {
    activeTooltip.classList.remove('visible');
    activeTooltip = null;
  }
}

/**
 * Cache le tooltip avec délai
 * @param {number} delay - Délai en ms
 */
function hideTooltipDelayed(delay = 100) {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }

  tooltipTimeout = setTimeout(() => {
    hideTooltip();
  }, delay);
}

/**
 * Annule le délai de masquage
 */
function cancelTooltipHide() {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
}

/**
 * Affiche un toast (notification temporaire)
 * @param {string} message - Le message
 * @param {string} type - Type (success, error, warning, info)
 * @param {number} duration - Durée en ms
 */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto-suppression
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Ajoute les event listeners pour les tooltips d'items
 */
function initItemTooltips() {
  document.addEventListener('mouseover', (e) => {
    const inventorySlot = e.target.closest('.inventory-slot:not(.empty)');
    const equipmentSlot = e.target.closest('.equipment-slot.equipped');

    if (inventorySlot) {
      const itemId = inventorySlot.dataset.itemId;
      const inventory = getInventory();
      const item = inventory.find(i => i.instanceId === itemId);

      if (item) {
        cancelTooltipHide();
        showItemTooltip(item, e);
      }
    } else if (equipmentSlot) {
      const itemId = equipmentSlot.dataset.itemId;
      const equipment = getEquipment();

      for (const slot in equipment) {
        if (equipment[slot]?.instanceId === itemId) {
          cancelTooltipHide();
          showItemTooltip(equipment[slot], e);
          break;
        }
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const inventorySlot = e.target.closest('.inventory-slot:not(.empty)');
    const equipmentSlot = e.target.closest('.equipment-slot.equipped');

    if (inventorySlot || equipmentSlot) {
      hideTooltipDelayed();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (activeTooltip && activeTooltip.classList.contains('visible')) {
      positionTooltip(activeTooltip, e);
    }
  });
}

// Export pour utilisation globale
window.showItemTooltip = showItemTooltip;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
window.showToast = showToast;
window.initItemTooltips = initItemTooltips;
