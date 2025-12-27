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
 * Termine une expédition et lance le combat interactif
 */
function handleExpeditionComplete() {
  const expedition = getActiveExpedition();

  if (!expedition) {
    showToast('Aucune expédition en cours', 'error');
    return;
  }

  if (!expedition.completed) {
    showToast('L\'expédition n\'est pas encore terminée', 'error');
    return;
  }

  // Préparer le combat
  const combatData = prepareExpeditionCombat(expedition);

  if (!combatData.success) {
    showToast(combatData.message, 'error');
    return;
  }

  // Stocker les données pour après le combat
  window.pendingExpedition = {
    zone: combatData.zone,
    isBoss: combatData.isBoss,
    monster: combatData.monster
  };

  // Lancer le combat interactif
  showCombatModal(combatData.player, combatData.enemy, null, true);
}

/**
 * Prépare les données pour le combat d'expédition
 * @param {Object} expedition - L'expédition
 * @returns {Object} Données du combat
 */
function prepareExpeditionCombat(expedition) {
  const zone = ZONES[expedition.zoneId];
  const character = loadCharacter();

  // Déterminer si c'est un boss
  const isBoss = Helpers.checkChance(zone.bossChance * 100);

  // Générer le monstre
  const monsterLevel = calculateMonsterLevel(zone, character.level);
  let monster;

  if (isBoss) {
    monster = getZoneBoss(expedition.zoneId, zone.levelMax);
  } else {
    monster = getRandomMonster(expedition.zoneId, monsterLevel);
  }

  if (!monster) {
    Storage.saveExpedition(null);
    return { success: false, message: 'Erreur: aucun monstre trouvé' };
  }

  // Préparer les combattants
  const playerCombatant = createPlayerCombatant(character);
  const monsterCombatant = createMonsterCombatant(monster);

  // Ajouter les récompenses au monstre pour le combat interactif
  monsterCombatant.goldReward = monster.goldReward;
  monsterCombatant.xpReward = monster.xpReward;

  return {
    success: true,
    player: playerCombatant,
    enemy: monsterCombatant,
    zone: zone,
    isBoss: isBoss,
    monster: monster
  };
}

/**
 * Appelée quand le combat interactif se termine
 * @param {Object} result - Résultat du combat
 */
function onInteractiveCombatEnd(result) {
  const pendingExp = window.pendingExpedition;
  const pendingArena = window.pendingArenaFight;

  if (pendingExp) {
    // C'était un combat d'expédition
    const character = loadCharacter();

    if (result.victory) {
      // XP et Or
      if (result.rewards) {
        const xpResult = addXp(character, result.rewards.xp);
        addGold(character, result.rewards.gold);

        if (xpResult.leveledUp) {
          setTimeout(() => {
            animateLevelUp(xpResult.newLevel);
          }, 500);
        }
      }

      // Générer le loot
      const luckBonus = character.derivedStats.luck || 0;
      let loot = [];

      if (pendingExp.isBoss) {
        const bossLoot = generateBossLoot(pendingExp.zone, character.level);
        if (bossLoot) {
          const added = addToInventory(bossLoot);
          if (added) {
            loot.push(bossLoot);
          }
        }
      } else {
        const generatedLoot = generateExpeditionLoot(pendingExp.zone, character.level, luckBonus);
        for (const item of generatedLoot) {
          const added = addToInventory(item);
          if (added) {
            loot.push(item);
          }
        }
      }

      // Animer le loot
      if (loot.length > 0) {
        setTimeout(() => {
          loot.forEach((item, index) => {
            setTimeout(() => animateLootDrop(item), index * 500);
          });
        }, 1000);
      }

      // Soigner partiellement
      healCharacter(character, Math.floor(character.derivedStats.maxHp * 0.3));
    } else {
      // Défaite - XP réduit
      const reducedXp = Math.floor((pendingExp.monster.xpReward || 50) * 0.3);
      addXp(character, reducedXp);
      healCharacter(character, -1);
    }

    // Nettoyer
    Storage.saveExpedition(null);
    window.pendingExpedition = null;
  } else if (pendingArena) {
    // C'était un combat d'arène
    const arena = getArenaData();
    const character = loadCharacter();

    // Appliquer les résultats de l'arène
    const pointsChange = result.victory ?
      ARENA_CONFIG.pointsWin :
      ARENA_CONFIG.pointsLoss;

    arena.points = Math.max(0, arena.points + pointsChange);
    arena.fightsToday--;
    Storage.saveArena(arena);

    // Soigner le joueur après le combat
    healCharacter(character, -1);

    // Afficher le changement de points
    if (result.victory) {
      showToast(`+${ARENA_CONFIG.pointsWin} points d'arène !`, 'success');
    } else {
      showToast(`${ARENA_CONFIG.pointsLoss} points d'arène`, 'error');
    }

    window.pendingArenaFight = null;
  }

  // Réinitialiser le combat
  resetInteractiveCombat();
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

  // Vérifier les combats restants
  if (arena.fightsToday <= 0) {
    showToast('Plus de combats disponibles aujourd\'hui', 'error');
    return;
  }

  // Préparer les combattants pour l'affichage
  const character = loadCharacter();
  const playerCombatant = createPlayerCombatant(character);

  // Créer le combattant ennemi
  const opponentCombatant = {
    ...opponent,
    isPlayer: false,
    goldReward: { min: 0, max: 0 },
    xpReward: 0
  };

  // Stocker les données pour après le combat
  window.pendingArenaFight = {
    opponentId: opponentId
  };

  // Lancer le combat interactif
  showCombatModal(playerCombatant, opponentCombatant, null, true);
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
window.onInteractiveCombatEnd = onInteractiveCombatEnd;
window.prepareExpeditionCombat = prepareExpeditionCombat;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', initGame);
