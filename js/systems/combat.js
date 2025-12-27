/* ==============================================
   ELANIA RPG - Système de Combat
   ============================================== */

/**
 * État global du combat interactif
 */
let currentInteractiveCombat = null;

/**
 * Crée un combattant à partir du personnage joueur
 * @param {Object} character - Le personnage
 * @returns {Object} Combattant formaté
 */
function createPlayerCombatant(character) {
  return {
    id: 'player',
    name: character.name,
    icon: '⚔️',
    isPlayer: true,
    level: character.level,
    stats: { ...character.derivedStats },
    currentHp: character.currentHp,
    maxHp: character.derivedStats.maxHp,
    skillState: createCombatSkillState(character)
  };
}

/**
 * Crée un combattant à partir d'un monstre
 * @param {Object} monster - Le monstre
 * @returns {Object} Combattant formaté
 */
function createMonsterCombatant(monster) {
  return {
    id: monster.id,
    name: monster.name,
    icon: monster.icon,
    isPlayer: false,
    level: monster.level,
    stats: { ...monster.derivedStats },
    currentHp: monster.currentHp,
    maxHp: monster.derivedStats.maxHp,
    xpReward: monster.xpReward,
    goldReward: monster.goldReward,
    isBoss: monster.isBoss || false
  };
}

/**
 * Calcule les dégâts d'une attaque
 * @param {Object} attacker - L'attaquant
 * @param {Object} defender - Le défenseur
 * @returns {Object} Résultat de l'attaque
 */
function calculateAttackDamage(attacker, defender) {
  const result = {
    damage: 0,
    isCritical: false,
    isDodged: false,
    attackType: 'physical'
  };

  // Vérifier l'esquive
  if (Helpers.checkChance(defender.stats.dodge)) {
    result.isDodged = true;
    return result;
  }

  // Déterminer le type d'attaque (physique ou magique basé sur la stat la plus haute)
  const usesMagic = attacker.stats.magicAttack > attacker.stats.attack;
  result.attackType = usesMagic ? 'magic' : 'physical';

  // Calculer les dégâts de base
  let baseDamage = usesMagic ? attacker.stats.magicAttack : attacker.stats.attack;

  // Variation aléatoire (±10%)
  baseDamage = Math.floor(baseDamage * Helpers.randomFloat(0.9, 1.1));

  // Vérifier le critique
  if (Helpers.checkChance(attacker.stats.critical)) {
    result.isCritical = true;
    baseDamage = Math.floor(baseDamage * 2);
  }

  // Appliquer la défense (réduction, minimum 1 dégât)
  const defense = Math.floor(defender.stats.defense * 0.5);
  result.damage = Math.max(1, baseDamage - defense);

  return result;
}

/**
 * Détermine l'ordre d'initiative
 * @param {Object} combatant1 - Premier combattant
 * @param {Object} combatant2 - Second combattant
 * @returns {Array} Combattants ordonnés par initiative
 */
function determineInitiative(combatant1, combatant2) {
  const init1 = combatant1.stats.agility + Helpers.randomInt(1, 10);
  const init2 = combatant2.stats.agility + Helpers.randomInt(1, 10);

  if (init1 >= init2) {
    return [combatant1, combatant2];
  }
  return [combatant2, combatant1];
}

/**
 * Exécute un combat complet
 * @param {Object} player - Combattant joueur
 * @param {Object} enemy - Combattant ennemi
 * @returns {Object} Résultat du combat avec log
 */
function executeCombat(player, enemy) {
  const log = [];
  let turn = 1;
  const maxTurns = 100; // Sécurité anti-boucle infinie

  // Déterminer l'initiative
  const [first, second] = determineInitiative(player, enemy);

  log.push({
    type: 'info',
    message: `Le combat commence ! ${first.name} a l'initiative.`
  });

  // Boucle de combat
  while (player.currentHp > 0 && enemy.currentHp > 0 && turn <= maxTurns) {
    log.push({
      type: 'turn',
      message: `--- Tour ${turn} ---`
    });

    // Premier attaquant
    const result1 = processTurn(first, second, log);
    if (second.currentHp <= 0) break;

    // Second attaquant
    const result2 = processTurn(second, first, log);
    if (first.currentHp <= 0) break;

    turn++;
  }

  // Déterminer le vainqueur
  const victory = player.currentHp > 0;

  // Calculer les récompenses
  let rewards = null;
  if (victory) {
    const goldAmount = Helpers.randomInt(enemy.goldReward.min, enemy.goldReward.max);
    rewards = {
      xp: enemy.xpReward,
      gold: goldAmount
    };

    log.push({
      type: 'victory',
      message: `Victoire ! Vous avez vaincu ${enemy.name} !`
    });
    log.push({
      type: 'reward',
      message: `+${rewards.xp} XP, +${rewards.gold} Or`
    });
  } else {
    log.push({
      type: 'defeat',
      message: `Défaite... ${enemy.name} vous a vaincu.`
    });
  }

  return {
    victory,
    log,
    turns: turn,
    playerHpRemaining: player.currentHp,
    enemyHpRemaining: enemy.currentHp,
    rewards
  };
}

/**
 * Traite un tour de combat pour un attaquant
 * @param {Object} attacker - L'attaquant
 * @param {Object} defender - Le défenseur
 * @param {Array} log - Log du combat
 * @returns {Object} Résultat du tour
 */
function processTurn(attacker, defender, log) {
  const attackResult = calculateAttackDamage(attacker, defender);

  if (attackResult.isDodged) {
    log.push({
      type: defender.isPlayer ? 'player-dodge' : 'enemy-dodge',
      message: `${defender.name} esquive l'attaque de ${attacker.name} !`,
      isDodge: true
    });
    return attackResult;
  }

  // Appliquer les dégâts
  defender.currentHp = Math.max(0, defender.currentHp - attackResult.damage);

  // Construire le message
  let message = `${attacker.name} inflige ${attackResult.damage} dégâts à ${defender.name}`;

  if (attackResult.isCritical) {
    message += ' (CRITIQUE !)';
  }

  message += ` [${defender.currentHp}/${defender.maxHp} PV]`;

  log.push({
    type: attacker.isPlayer ? 'player-attack' : 'enemy-attack',
    message,
    damage: attackResult.damage,
    isCritical: attackResult.isCritical,
    defenderHp: defender.currentHp,
    defenderMaxHp: defender.maxHp
  });

  return attackResult;
}

/**
 * Simule un combat rapide (sans animation, pour l'arène par exemple)
 * @param {Object} player - Combattant joueur
 * @param {Object} enemy - Combattant ennemi
 * @returns {Object} Résultat simplifié
 */
function simulateCombat(player, enemy) {
  const playerCopy = { ...player, currentHp: player.maxHp };
  const enemyCopy = { ...enemy, currentHp: enemy.maxHp };

  const result = executeCombat(playerCopy, enemyCopy);

  return {
    victory: result.victory,
    turns: result.turns,
    playerHpRemaining: result.playerHpRemaining,
    enemyHpRemaining: result.enemyHpRemaining,
    rewards: result.rewards
  };
}

/**
 * Prépare les données pour l'affichage animé du combat
 * @param {Object} combatResult - Résultat du combat
 * @returns {Array} Actions pour l'animation
 */
function prepareCombatAnimation(combatResult) {
  const actions = [];

  // Support both 'log' (direct combat) and 'combatLog' (expedition result)
  const log = combatResult.log || combatResult.combatLog || [];

  for (const entry of log) {
    switch (entry.type) {
      case 'player-attack':
      case 'enemy-attack':
        actions.push({
          type: 'attack',
          isPlayer: entry.type === 'player-attack',
          message: entry.message,
          damage: entry.damage,
          isCritical: entry.isCritical,
          targetHp: entry.defenderHp,
          targetMaxHp: entry.defenderMaxHp,
          delay: 600
        });
        break;
      case 'player-dodge':
      case 'enemy-dodge':
        actions.push({
          type: 'dodge',
          isPlayer: entry.type === 'player-dodge',
          message: entry.message,
          delay: 400
        });
        break;
      case 'victory':
      case 'defeat':
        actions.push({
          type: entry.type,
          message: entry.message,
          delay: 1000
        });
        break;
      case 'reward':
        actions.push({
          type: 'reward',
          message: entry.message,
          delay: 500
        });
        break;
    }
  }

  return actions;
}

/**
 * Initialise un combat interactif
 * @param {Object} player - Combattant joueur
 * @param {Object} enemy - Combattant ennemi
 * @param {Object} options - Options du combat
 * @returns {Object} État du combat
 */
function initInteractiveCombat(player, enemy, options = {}) {
  currentInteractiveCombat = {
    player: player,
    enemy: enemy,
    turn: 1,
    phase: 'player', // 'player' ou 'enemy'
    log: [],
    isFinished: false,
    victory: null,
    options: options,
    enemyEffects: [] // Effets sur l'ennemi
  };

  // Déterminer l'initiative
  const playerInit = player.stats.agility + Helpers.randomInt(1, 10);
  const enemyInit = (enemy.stats?.agility || enemy.baseStats?.agility || 5) + Helpers.randomInt(1, 10);

  if (playerInit >= enemyInit) {
    currentInteractiveCombat.phase = 'player';
    addCombatLog('info', `Le combat commence ! ${player.name} a l'initiative.`);
  } else {
    currentInteractiveCombat.phase = 'enemy';
    addCombatLog('info', `Le combat commence ! ${enemy.name} a l'initiative.`);
  }

  addCombatLog('turn', `--- Tour ${currentInteractiveCombat.turn} ---`);

  return currentInteractiveCombat;
}

/**
 * Ajoute une entrée au log de combat
 * @param {string} type - Type d'entrée
 * @param {string} message - Message
 * @param {Object} data - Données supplémentaires
 */
function addCombatLog(type, message, data = {}) {
  if (!currentInteractiveCombat) return;

  currentInteractiveCombat.log.push({
    type,
    message,
    ...data
  });
}

/**
 * Exécute l'action du joueur
 * @param {string} skillId - ID de la compétence utilisée
 * @returns {Object} Résultat de l'action
 */
function executePlayerAction(skillId) {
  if (!currentInteractiveCombat || currentInteractiveCombat.phase !== 'player') {
    return { success: false, message: 'Ce n\'est pas votre tour' };
  }

  const combat = currentInteractiveCombat;
  const player = combat.player;
  const enemy = combat.enemy;

  // Utiliser la compétence
  const skillResult = useSkill(player.skillState, skillId, player, enemy);

  if (!skillResult.success) {
    return skillResult;
  }

  // Appliquer les dégâts
  if (skillResult.damage > 0) {
    // Appliquer le boost de dégâts
    const damageModifier = getDamageModifier(player.skillState);
    const finalDamage = Math.floor(skillResult.damage * damageModifier);

    enemy.currentHp = Math.max(0, enemy.currentHp - finalDamage);

    addCombatLog('player-attack', skillResult.message, {
      damage: finalDamage,
      isCritical: skillResult.damage >= player.stats.attack * 1.8,
      defenderHp: enemy.currentHp,
      defenderMaxHp: enemy.maxHp
    });
  }

  // Appliquer le soin
  if (skillResult.healing > 0) {
    player.currentHp = Math.min(player.maxHp, player.currentHp + skillResult.healing);

    addCombatLog('player-heal', skillResult.message, {
      healing: skillResult.healing,
      playerHp: player.currentHp,
      playerMaxHp: player.maxHp
    });
  }

  // Appliquer les effets de buff
  if (skillResult.skill.type === 'buff' && skillResult.effects.length > 0) {
    addCombatLog('player-buff', skillResult.message, {
      effects: skillResult.effects
    });
  }

  // Appliquer les effets sur la cible
  if (skillResult.targetEffects) {
    combat.enemyEffects.push(...skillResult.targetEffects);
  }

  // Vérifier si l'ennemi est mort
  if (enemy.currentHp <= 0) {
    return finishCombat(true);
  }

  // Passer au tour de l'ennemi
  combat.phase = 'enemy';

  return {
    success: true,
    continuesCombat: true,
    playerAction: skillResult
  };
}

/**
 * Exécute le tour de l'ennemi
 * @returns {Object} Résultat de l'action ennemie
 */
function executeEnemyTurn() {
  if (!currentInteractiveCombat || currentInteractiveCombat.phase !== 'enemy') {
    return { success: false, message: 'Ce n\'est pas le tour de l\'ennemi' };
  }

  const combat = currentInteractiveCombat;
  const player = combat.player;
  const enemy = combat.enemy;

  // Appliquer les effets de DoT sur l'ennemi
  let dotDamage = 0;
  combat.enemyEffects = combat.enemyEffects.filter(effect => {
    if (effect.type === 'burn') {
      dotDamage += effect.value;
    }
    effect.remainingDuration--;
    return effect.remainingDuration > 0;
  });

  if (dotDamage > 0) {
    enemy.currentHp = Math.max(0, enemy.currentHp - dotDamage);
    addCombatLog('dot', `${enemy.name} subit ${dotDamage} dégâts de brûlure !`, {
      damage: dotDamage,
      defenderHp: enemy.currentHp,
      defenderMaxHp: enemy.maxHp
    });

    if (enemy.currentHp <= 0) {
      return finishCombat(true);
    }
  }

  // L'ennemi attaque
  const attackResult = calculateAttackDamage(enemy, player);

  if (attackResult.isDodged) {
    addCombatLog('player-dodge', `${player.name} esquive l'attaque de ${enemy.name} !`, {
      isDodge: true
    });
  } else {
    // Appliquer la réduction de dégâts
    const damageReduction = getDamageReduction(player.skillState);
    const finalDamage = Math.max(1, Math.floor(attackResult.damage * (1 - damageReduction)));

    player.currentHp = Math.max(0, player.currentHp - finalDamage);

    let message = `${enemy.name} inflige ${finalDamage} dégâts à ${player.name}`;
    if (attackResult.isCritical) {
      message += ' (CRITIQUE !)';
    }
    if (damageReduction > 0) {
      message += ` (${Math.floor(damageReduction * 100)}% bloqué)`;
    }
    message += ` [${player.currentHp}/${player.maxHp} PV]`;

    addCombatLog('enemy-attack', message, {
      damage: finalDamage,
      isCritical: attackResult.isCritical,
      defenderHp: player.currentHp,
      defenderMaxHp: player.maxHp
    });
  }

  // Vérifier si le joueur est mort
  if (player.currentHp <= 0) {
    return finishCombat(false);
  }

  // Mettre à jour les cooldowns du joueur
  updateCooldowns(player.skillState);

  // Nouveau tour
  combat.turn++;
  combat.phase = 'player';
  addCombatLog('turn', `--- Tour ${combat.turn} ---`);

  return {
    success: true,
    continuesCombat: true,
    enemyAttack: attackResult
  };
}

/**
 * Termine le combat
 * @param {boolean} victory - Victoire du joueur
 * @returns {Object} Résultat final
 */
function finishCombat(victory) {
  const combat = currentInteractiveCombat;
  combat.isFinished = true;
  combat.victory = victory;

  if (victory) {
    addCombatLog('victory', `Victoire ! Vous avez vaincu ${combat.enemy.name} !`);
  } else {
    addCombatLog('defeat', `Défaite... ${combat.enemy.name} vous a vaincu.`);
  }

  // Calculer les récompenses si victoire
  let rewards = null;
  if (victory && combat.enemy.goldReward) {
    const goldAmount = Helpers.randomInt(combat.enemy.goldReward.min, combat.enemy.goldReward.max);
    rewards = {
      xp: combat.enemy.xpReward || 0,
      gold: goldAmount
    };

    addCombatLog('reward', `+${rewards.xp} XP, +${rewards.gold} Or`);
  }

  return {
    success: true,
    continuesCombat: false,
    isFinished: true,
    victory: victory,
    log: combat.log,
    turns: combat.turn,
    playerHpRemaining: combat.player.currentHp,
    enemyHpRemaining: combat.enemy.currentHp,
    rewards: rewards
  };
}

/**
 * Récupère l'état actuel du combat
 * @returns {Object} État du combat
 */
function getCurrentCombatState() {
  return currentInteractiveCombat;
}

/**
 * Réinitialise le combat interactif
 */
function resetInteractiveCombat() {
  currentInteractiveCombat = null;
}

// Export pour utilisation globale
window.createPlayerCombatant = createPlayerCombatant;
window.createMonsterCombatant = createMonsterCombatant;
window.calculateAttackDamage = calculateAttackDamage;
window.determineInitiative = determineInitiative;
window.executeCombat = executeCombat;
window.simulateCombat = simulateCombat;
window.prepareCombatAnimation = prepareCombatAnimation;
window.initInteractiveCombat = initInteractiveCombat;
window.executePlayerAction = executePlayerAction;
window.executeEnemyTurn = executeEnemyTurn;
window.getCurrentCombatState = getCurrentCombatState;
window.resetInteractiveCombat = resetInteractiveCombat;
