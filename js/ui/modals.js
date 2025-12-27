/* ==============================================
   ELANIA RPG - Gestion des Modals
   ============================================== */

/**
 * Ouvre une modal
 * @param {string} modalId - ID de la modal
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Ferme une modal
 * @param {string} modalId - ID de la modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Ferme toutes les modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = '';
}

/**
 * Affiche la modal d'item (tooltip/actions)
 * @param {Object} item - L'item à afficher
 * @param {Object} options - Options d'affichage
 */
function showItemModal(item, options = {}) {
  const modal = document.getElementById('item-modal');
  const rarity = RARITIES[item.rarity];

  // Titre
  document.getElementById('item-modal-title').textContent = item.name;
  document.getElementById('item-modal-title').style.color = rarity.color;

  // Corps
  const body = document.getElementById('item-modal-body');

  let statsHtml = formatItemStats(item).map(stat => `<div class="stat-row"><span>${stat}</span></div>`).join('');

  body.innerHTML = `
    <div class="item-modal-icon" style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">
      ${item.icon}
    </div>
    <div class="item-modal-rarity" style="text-align: center; color: ${rarity.color}; margin-bottom: 1rem;">
      ${rarity.name}
    </div>
    <div class="item-modal-level" style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">
      Niveau requis: ${item.levelRequired || 1}
    </div>
    <div class="item-modal-stats">
      ${statsHtml}
    </div>
    ${item.setId ? `
      <div class="item-modal-set" style="margin-top: 1rem; color: var(--rarity-uncommon);">
        Set: ${EQUIPMENT_SETS[item.setId]?.name || 'Inconnu'}
      </div>
    ` : ''}
  `;

  // Actions
  const footer = document.getElementById('item-modal-footer');
  let actionsHtml = '';

  if (options.showEquip) {
    actionsHtml += `<button class="btn btn-primary" onclick="handleEquipItem('${item.instanceId}')">Équiper</button>`;
  }

  if (options.showUnequip) {
    actionsHtml += `<button class="btn btn-secondary" onclick="handleUnequipItem('${options.slot}')">Déséquiper</button>`;
  }

  if (options.showSell) {
    const sellPrice = calculateSellPrice(item);
    actionsHtml += `<button class="btn btn-danger" onclick="handleSellItem('${item.instanceId}')">Vendre (${sellPrice} or)</button>`;
  }

  actionsHtml += `<button class="btn btn-secondary" onclick="closeModal('item-modal')">Fermer</button>`;

  footer.innerHTML = actionsHtml;

  openModal('item-modal');
}

/**
 * Affiche la modal de combat
 * @param {Object} playerCombatant - Combattant joueur
 * @param {Object} enemyCombatant - Combattant ennemi
 * @param {Object} combatResult - Résultat du combat
 */
function showCombatModal(playerCombatant, enemyCombatant, combatResult) {
  const modal = document.getElementById('combat-modal');

  // Infos des combattants
  document.getElementById('combat-player-name').textContent = playerCombatant.name;
  document.getElementById('combat-player-level').textContent = `Niv. ${playerCombatant.level}`;
  document.getElementById('combat-enemy-name').textContent = enemyCombatant.name;
  document.getElementById('combat-enemy-level').textContent = `Niv. ${enemyCombatant.level}`;
  document.getElementById('combat-enemy-icon').textContent = enemyCombatant.icon;

  // Reset des barres de vie
  document.getElementById('combat-player-hp-fill').style.width = '100%';
  document.getElementById('combat-enemy-hp-fill').style.width = '100%';
  document.getElementById('combat-player-hp-text').textContent = `${playerCombatant.maxHp}/${playerCombatant.maxHp}`;
  document.getElementById('combat-enemy-hp-text').textContent = `${enemyCombatant.maxHp}/${enemyCombatant.maxHp}`;

  // Vider le log
  document.getElementById('combat-log').innerHTML = '';

  // Cacher le résultat
  document.getElementById('combat-result').style.display = 'none';
  document.getElementById('combat-actions').style.display = 'flex';

  openModal('combat-modal');

  // Stocker les données pour l'animation
  window.currentCombat = {
    player: playerCombatant,
    enemy: enemyCombatant,
    result: combatResult,
    animationIndex: 0
  };
}

/**
 * Anime le combat tour par tour
 */
async function animateCombat() {
  const combat = window.currentCombat;
  if (!combat) return;

  const actions = prepareCombatAnimation(combat.result);
  const logElement = document.getElementById('combat-log');
  const playerHpFill = document.getElementById('combat-player-hp-fill');
  const playerHpText = document.getElementById('combat-player-hp-text');
  const enemyHpFill = document.getElementById('combat-enemy-hp-fill');
  const enemyHpText = document.getElementById('combat-enemy-hp-text');

  let playerHp = combat.player.maxHp;
  let enemyHp = combat.enemy.maxHp;

  document.getElementById('combat-actions').innerHTML = `
    <button class="btn btn-secondary" onclick="skipCombatAnimation()">Passer</button>
  `;

  for (const action of actions) {
    if (window.skipCombat) {
      break;
    }

    // Ajouter au log
    const logEntry = document.createElement('div');
    logEntry.className = `combat-log-entry ${action.isPlayer ? 'player-action' : 'enemy-action'}`;

    if (action.isCritical) {
      logEntry.classList.add('critical');
    }
    if (action.type === 'dodge') {
      logEntry.classList.add('dodge');
    }

    logEntry.textContent = action.message;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;

    // Mettre à jour les barres de vie
    if (action.type === 'attack') {
      if (action.isPlayer) {
        enemyHp = action.targetHp;
        const percent = (enemyHp / combat.enemy.maxHp) * 100;
        enemyHpFill.style.width = `${percent}%`;
        enemyHpText.textContent = `${enemyHp}/${combat.enemy.maxHp}`;
      } else {
        playerHp = action.targetHp;
        const percent = (playerHp / combat.player.maxHp) * 100;
        playerHpFill.style.width = `${percent}%`;
        playerHpText.textContent = `${playerHp}/${combat.player.maxHp}`;
      }
    }

    await Helpers.wait(action.delay || 500);
  }

  // Afficher le résultat
  showCombatResult(combat.result);
}

/**
 * Passe l'animation de combat
 */
function skipCombatAnimation() {
  window.skipCombat = true;
  const combat = window.currentCombat;

  if (combat) {
    // Mettre à jour les barres de vie finales
    const playerPercent = (combat.result.playerHpRemaining / combat.player.maxHp) * 100;
    const enemyPercent = (combat.result.enemyHpRemaining / combat.enemy.maxHp) * 100;

    document.getElementById('combat-player-hp-fill').style.width = `${playerPercent}%`;
    document.getElementById('combat-player-hp-text').textContent = `${combat.result.playerHpRemaining}/${combat.player.maxHp}`;
    document.getElementById('combat-enemy-hp-fill').style.width = `${enemyPercent}%`;
    document.getElementById('combat-enemy-hp-text').textContent = `${combat.result.enemyHpRemaining}/${combat.enemy.maxHp}`;

    showCombatResult(combat.result);
  }
}

/**
 * Affiche le résultat du combat
 * @param {Object} result - Résultat du combat
 */
function showCombatResult(result) {
  const resultElement = document.getElementById('combat-result');
  resultElement.style.display = 'block';
  resultElement.className = `combat-result ${result.victory ? 'victory' : 'defeat'}`;

  let html = `<h3>${result.victory ? 'Victoire !' : 'Défaite...'}</h3>`;

  if (result.rewards) {
    html += '<div class="combat-rewards">';
    if (result.rewards.xp) {
      html += `<div class="reward-item"><span>📈</span><span>+${result.rewards.xp} XP</span></div>`;
    }
    if (result.rewards.gold) {
      html += `<div class="reward-item"><span>💰</span><span>+${result.rewards.gold} Or</span></div>`;
    }
    html += '</div>';

    if (result.rewards.loot && result.rewards.loot.length > 0) {
      html += '<div class="combat-loot mt-2">';
      result.rewards.loot.forEach(item => {
        html += `<div class="reward-item" style="border-color: ${RARITIES[item.rarity].color}">
          <span>${item.icon}</span>
          <span class="rarity-${item.rarity}">${item.name}</span>
        </div>`;
      });
      html += '</div>';
    }
  }

  resultElement.innerHTML = html;

  document.getElementById('combat-actions').innerHTML = `
    <button class="btn btn-primary" onclick="closeCombatModal()">Continuer</button>
  `;

  window.skipCombat = false;
}

/**
 * Ferme la modal de combat et rafraîchit
 */
function closeCombatModal() {
  closeModal('combat-modal');
  window.currentCombat = null;

  // Rafraîchir l'écran actuel
  refreshScreen(currentScreen);
  updateGoldDisplay();
}

/**
 * Affiche la modal de confirmation
 * @param {string} title - Titre
 * @param {string} message - Message
 * @param {Function} onConfirm - Callback de confirmation
 */
function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;

  window.confirmCallback = onConfirm;

  openModal('confirm-modal');
}

/**
 * Confirme l'action
 */
function confirmAction() {
  if (window.confirmCallback) {
    window.confirmCallback();
    window.confirmCallback = null;
  }
  closeModal('confirm-modal');
}

/**
 * Annule l'action
 */
function cancelAction() {
  window.confirmCallback = null;
  closeModal('confirm-modal');
}

// Export pour utilisation globale
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.showItemModal = showItemModal;
window.showCombatModal = showCombatModal;
window.animateCombat = animateCombat;
window.skipCombatAnimation = skipCombatAnimation;
window.showCombatResult = showCombatResult;
window.closeCombatModal = closeCombatModal;
window.showConfirmModal = showConfirmModal;
window.confirmAction = confirmAction;
window.cancelAction = cancelAction;
