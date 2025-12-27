/* ==============================================
   ELANIA RPG - Point d'entrée principal
   ============================================== */

/**
 * Initialise le jeu
 */
function initGame() {
  // Vérifier si un personnage existe
  if (!hasCharacter()) {
    window.location.href = 'index.html';
    return;
  }

  // Charger le personnage
  const character = loadCharacter();

  // Mettre à jour les stats dérivées (au cas où l'équipement a changé)
  updateDerivedStats(character);

  // Initialiser l'interface
  updateGoldDisplay();
  initItemTooltips();
  initEventListeners();

  // Afficher l'écran par défaut
  switchScreen('character');

  // Vérifier les expéditions en cours
  checkActiveExpedition();

  console.log('Elania RPG initialisé !', character);
}

/**
 * Vérifie s'il y a une expédition active
 */
function checkActiveExpedition() {
  const expedition = getActiveExpedition();

  if (expedition) {
    if (expedition.completed) {
      showToast('Votre expédition est terminée !', 'success');
    } else {
      startExpeditionTimer();
    }
  }
}

/**
 * Initialise les event listeners
 */
function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const screen = btn.dataset.screen;
      if (screen) {
        switchScreen(screen);
      }
    });
  });

  // Boutons d'ajout de stats
  document.querySelectorAll('.stat-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const stat = btn.dataset.stat;
      if (stat) {
        handleAddStat(stat);
      }
    });
  });

  // Slots d'équipement
  document.querySelectorAll('.equipment-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const slotId = slot.id.replace('slot-', '');
      handleEquipmentSlotClick(slotId);
    });
  });

  // Fermeture des modals au clic extérieur
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Touche Escape pour fermer les modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      hideTooltip();
    }
  });
}

/**
 * Gère l'ajout d'un point de stat
 * @param {string} stat - La stat à augmenter
 */
function handleAddStat(stat) {
  const character = loadCharacter();

  if (addStatPoint(character, stat)) {
    showToast(`+1 ${stat}`, 'success');
    renderCharacterScreen();
  } else {
    showToast('Pas de points disponibles', 'error');
  }
}

/**
 * Gère le clic sur un slot d'équipement
 * @param {string} slotId - ID du slot
 */
function handleEquipmentSlotClick(slotId) {
  const equipment = getEquipment();
  const item = equipment[slotId];

  if (item) {
    showItemModal(item, {
      showUnequip: true,
      slot: slotId
    });
  }
}

/**
 * Gère le clic sur un item d'inventaire
 * @param {string} instanceId - ID de l'instance de l'item
 */
function handleInventoryItemClick(instanceId) {
  const inventory = getInventory();
  const item = inventory.find(i => i.instanceId === instanceId);

  if (item) {
    hideTooltip();
    showItemModal(item, {
      showEquip: true,
      showSell: true
    });
  }
}

/**
 * Équipe un item
 * @param {string} instanceId - ID de l'instance de l'item
 */
function handleEquipItem(instanceId) {
  const result = equipItem(instanceId);

  closeModal('item-modal');

  if (result.success) {
    showToast(result.message, 'success');
    renderCharacterScreen();
    renderInventoryScreen();
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Déséquipe un item
 * @param {string} slot - Slot à déséquiper
 */
function handleUnequipItem(slot) {
  const result = unequipItem(slot);

  closeModal('item-modal');

  if (result.success) {
    showToast(result.message, 'success');
    renderCharacterScreen();
    renderInventoryScreen();
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Vend un item
 * @param {string} instanceId - ID de l'instance de l'item
 */
function handleSellItem(instanceId) {
  const inventory = getInventory();
  const item = inventory.find(i => i.instanceId === instanceId);

  if (!item) return;

  showConfirmModal(
    'Vendre cet item ?',
    `Voulez-vous vendre ${item.name} pour ${calculateSellPrice(item)} or ?`,
    () => {
      const result = sellItem(instanceId);
      closeModal('item-modal');

      if (result.success) {
        showToast(result.message, 'success');
        animateGoldGain(result.gold);
        updateGoldDisplay();
        renderInventoryScreen();
      } else {
        showToast(result.message, 'error');
      }
    }
  );
}

/**
 * Démarre une expédition
 * @param {string} zoneId - ID de la zone
 */
function handleStartExpedition(zoneId) {
  const result = startExpedition(zoneId);

  if (result.success) {
    showToast(result.message, 'success');
    renderMapScreen();
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Termine une expédition
 */
function handleExpeditionComplete() {
  const result = completeExpedition();

  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  // Préparer les combattants pour l'affichage depuis le résultat
  const playerCombatant = {
    name: result.player.name,
    level: result.player.level,
    maxHp: result.player.maxHp
  };

  const enemyCombatant = {
    name: result.monster.name,
    icon: result.monster.icon,
    level: result.monster.level,
    maxHp: result.monster.maxHp
  };

  // Afficher le résultat (l'animation se lance automatiquement)
  showCombatModal(playerCombatant, enemyCombatant, result);

  // Gérer le level up
  if (result.levelUp) {
    setTimeout(() => {
      animateLevelUp(result.levelUp.newLevel);
    }, 500);
  }

  // Animer le loot
  if (result.rewards.loot && result.rewards.loot.length > 0) {
    setTimeout(() => {
      result.rewards.loot.forEach((item, index) => {
        setTimeout(() => animateLootDrop(item), index * 500);
      });
    }, 1000);
  }
}

/**
 * Lance un combat d'arène
 * @param {string} opponentId - ID de l'adversaire
 */
function handleArenaFight(opponentId) {
  const arena = getArenaData();
  const opponent = arena.opponents.find(o => o.id === opponentId);

  if (!opponent) {
    showToast('Adversaire non trouvé', 'error');
    return;
  }

  const result = startArenaFight(opponentId);

  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  // Préparer les combattants pour l'affichage
  const character = loadCharacter();
  const playerCombatant = createPlayerCombatant(character);

  const displayResult = {
    ...result,
    rewards: {
      xp: 0,
      gold: 0
    }
  };

  // Afficher le résultat (l'animation se lance automatiquement)
  showCombatModal(playerCombatant, opponent, displayResult);
}

/**
 * Ouvre les paramètres
 */
function openSettings() {
  showConfirmModal(
    'Réinitialiser le jeu ?',
    'Attention: Cela supprimera votre personnage et toute votre progression. Cette action est irréversible !',
    () => {
      deleteCharacter();
      window.location.href = 'index.html';
    }
  );
}

// Export pour utilisation globale
window.initGame = initGame;
window.handleAddStat = handleAddStat;
window.handleEquipmentSlotClick = handleEquipmentSlotClick;
window.handleInventoryItemClick = handleInventoryItemClick;
window.handleEquipItem = handleEquipItem;
window.handleUnequipItem = handleUnequipItem;
window.handleSellItem = handleSellItem;
window.handleStartExpedition = handleStartExpedition;
window.handleExpeditionComplete = handleExpeditionComplete;
window.handleArenaFight = handleArenaFight;
window.openSettings = openSettings;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', initGame);
