/* ==============================================
   ELANIA RPG - Système d'Expéditions
   ============================================== */

/**
 * Démarre une nouvelle expédition
 * @param {string} zoneId - ID de la zone
 * @returns {Object} Résultat du démarrage
 */
function startExpedition(zoneId) {
  const character = loadCharacter();
  const zone = ZONES[zoneId];

  if (!zone) {
    return { success: false, message: 'Zone inconnue' };
  }

  // Vérifier si une expédition est déjà en cours
  const currentExpedition = getActiveExpedition();
  if (currentExpedition) {
    return { success: false, message: 'Une expédition est déjà en cours' };
  }

  // Vérifier le niveau
  if (!isZoneAccessible(zoneId, character.level)) {
    return { success: false, message: `Niveau ${zone.levelMin} requis` };
  }

  // Créer l'expédition
  const expedition = {
    zoneId,
    startTime: Date.now(),
    endTime: Date.now() + (zone.expeditionTime * 1000),
    completed: false
  };

  Storage.saveExpedition(expedition);

  return {
    success: true,
    message: `Expédition vers ${zone.name} commencée !`,
    expedition
  };
}

/**
 * Récupère l'expédition active
 * @returns {Object|null} Expédition en cours ou null
 */
function getActiveExpedition() {
  const expedition = Storage.loadExpedition();

  if (!expedition) {
    return null;
  }

  // Vérifier si l'expédition est terminée
  if (Date.now() >= expedition.endTime) {
    expedition.completed = true;
  }

  return expedition;
}

/**
 * Calcule le temps restant de l'expédition
 * @param {Object} expedition - L'expédition
 * @returns {number} Temps restant en secondes
 */
function getExpeditionTimeRemaining(expedition) {
  if (!expedition) return 0;

  const remaining = Math.max(0, expedition.endTime - Date.now());
  return Math.ceil(remaining / 1000);
}

/**
 * Termine l'expédition et lance le combat
 * @returns {Object} Résultat de l'expédition
 */
function completeExpedition() {
  const expedition = getActiveExpedition();

  if (!expedition) {
    return { success: false, message: 'Aucune expédition en cours' };
  }

  if (!expedition.completed) {
    return { success: false, message: 'L\'expédition n\'est pas encore terminée' };
  }

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
    // Fallback si pas de monstre
    Storage.saveExpedition(null);
    return { success: false, message: 'Erreur: aucun monstre trouvé' };
  }

  // Préparer les combattants
  const playerCombatant = createPlayerCombatant(character);
  const monsterCombatant = createMonsterCombatant(monster);

  // Exécuter le combat
  const combatResult = executeCombat(playerCombatant, monsterCombatant);

  // Appliquer les résultats
  const result = processExpeditionResult(character, zone, combatResult, isBoss);

  // Nettoyer l'expédition
  Storage.saveExpedition(null);

  return result;
}

/**
 * Traite les résultats de l'expédition
 * @param {Object} character - Le personnage
 * @param {Object} zone - La zone
 * @param {Object} combatResult - Résultat du combat
 * @param {boolean} isBoss - Si c'était un boss
 * @returns {Object} Résultat final
 */
function processExpeditionResult(character, zone, combatResult, isBoss) {
  const result = {
    success: true,
    victory: combatResult.victory,
    combatLog: combatResult.log,
    turns: combatResult.turns,
    rewards: {
      xp: 0,
      gold: 0,
      loot: []
    },
    levelUp: null
  };

  if (combatResult.victory) {
    // XP et Or
    result.rewards.xp = combatResult.rewards.xp;
    result.rewards.gold = combatResult.rewards.gold;

    // Appliquer les récompenses
    const xpResult = addXp(character, result.rewards.xp);
    addGold(character, result.rewards.gold);

    if (xpResult.leveledUp) {
      result.levelUp = {
        newLevel: xpResult.newLevel,
        levelsGained: xpResult.levelsGained
      };
    }

    // Générer le loot
    const luckBonus = character.derivedStats.luck || 0;

    if (isBoss) {
      const bossLoot = generateBossLoot(zone, character.level);
      if (bossLoot) {
        const added = addToInventory(bossLoot);
        if (added) {
          result.rewards.loot.push(bossLoot);
        }
      }
    } else {
      const loot = generateExpeditionLoot(zone, character.level, luckBonus);
      for (const item of loot) {
        const added = addToInventory(item);
        if (added) {
          result.rewards.loot.push(item);
        }
      }
    }

    // Soigner le personnage après victoire (récupération partielle)
    healCharacter(character, Math.floor(character.derivedStats.maxHp * 0.3));
  } else {
    // En cas de défaite, XP réduit
    const reducedXp = Math.floor(combatResult.rewards?.xp * 0.3) || 10;
    result.rewards.xp = reducedXp;
    addXp(character, reducedXp);

    // Soigner le personnage après défaite
    healCharacter(character, -1); // Full heal
  }

  return result;
}

/**
 * Annule l'expédition en cours
 * @returns {boolean} Succès de l'annulation
 */
function cancelExpedition() {
  const expedition = getActiveExpedition();

  if (!expedition) {
    return false;
  }

  Storage.saveExpedition(null);
  return true;
}

/**
 * Formate le temps restant pour l'affichage
 * @param {number} seconds - Secondes restantes
 * @returns {string} Temps formaté
 */
function formatExpeditionTime(seconds) {
  if (seconds <= 0) {
    return 'Terminée !';
  }
  return Helpers.formatTime(seconds);
}

// Export pour utilisation globale
window.startExpedition = startExpedition;
window.getActiveExpedition = getActiveExpedition;
window.getExpeditionTimeRemaining = getExpeditionTimeRemaining;
window.completeExpedition = completeExpedition;
window.cancelExpedition = cancelExpedition;
window.formatExpeditionTime = formatExpeditionTime;
