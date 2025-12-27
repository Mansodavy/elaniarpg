/* ==============================================
   ELANIA RPG - Système de Personnage
   ============================================== */

// Origines disponibles
const ORIGINS = {
  peasant: {
    id: 'peasant',
    name: 'Paysan',
    description: 'Habitué aux travaux des champs, vous êtes endurant et apprenez vite.',
    bonus: { xpMultiplier: 1.05 },
    bonusText: '+5% XP',
    icon: '🌾'
  },
  soldier: {
    id: 'soldier',
    name: 'Soldat',
    description: 'Vétéran des guerres frontalières, vous excellez au combat rapproché.',
    bonus: { strength: 2 },
    bonusText: '+2 Force',
    icon: '⚔️'
  },
  thief: {
    id: 'thief',
    name: 'Voleur',
    description: 'Survie dans les rues vous a rendu agile et furtif.',
    bonus: { agility: 2 },
    bonusText: '+2 Agilité',
    icon: '🗡️'
  },
  scholar: {
    id: 'scholar',
    name: 'Érudit',
    description: 'Des années d\'études vous ont ouvert les portes de la magie.',
    bonus: { intelligence: 2 },
    bonusText: '+2 Intelligence',
    icon: '📚'
  }
};

/**
 * Crée un nouveau personnage
 * @param {string} name - Nom du personnage
 * @param {string} originId - ID de l'origine choisie
 * @returns {Object} Personnage créé
 */
function createCharacter(name, originId) {
  const origin = ORIGINS[originId] || ORIGINS.peasant;

  const character = {
    id: Helpers.generateId(),
    name: name.trim(),
    origin: origin.id,
    level: 1,
    xp: 0,
    xpToNextLevel: Helpers.xpForLevel(1),
    gold: 50, // Or de départ

    // Stats de base
    baseStats: {
      strength: 5 + (origin.bonus.strength || 0),
      agility: 5 + (origin.bonus.agility || 0),
      intelligence: 5 + (origin.bonus.intelligence || 0),
      endurance: 5 + (origin.bonus.endurance || 0),
      luck: 5 + (origin.bonus.luck || 0)
    },

    // Points de stats à distribuer
    statPoints: 0,

    // Bonus multiplicateurs
    multipliers: {
      xp: origin.bonus.xpMultiplier || 1,
      gold: 1,
      loot: 1
    },

    // Timestamps
    createdAt: Date.now(),
    lastSave: Date.now()
  };

  // Calculer les stats dérivées initiales
  character.derivedStats = calculateDerivedStats(character.baseStats, {});
  character.currentHp = character.derivedStats.maxHp;

  return character;
}

/**
 * Calcule les stats dérivées à partir des stats de base et de l'équipement
 * @param {Object} baseStats - Stats de base du personnage
 * @param {Object} equipmentStats - Stats bonus de l'équipement
 * @returns {Object} Stats dérivées
 */
function calculateDerivedStats(baseStats, equipmentStats = {}) {
  // Stats totales (base + équipement)
  const stats = {
    strength: (baseStats.strength || 0) + (equipmentStats.strength || 0),
    agility: (baseStats.agility || 0) + (equipmentStats.agility || 0),
    intelligence: (baseStats.intelligence || 0) + (equipmentStats.intelligence || 0),
    endurance: (baseStats.endurance || 0) + (equipmentStats.endurance || 0),
    luck: (baseStats.luck || 0) + (equipmentStats.luck || 0)
  };

  return {
    // Stats totales
    ...stats,

    // Stats dérivées calculées
    maxHp: 50 + (stats.endurance * 10) + (equipmentStats.maxHp || 0),
    attack: (stats.strength * 2) + (equipmentStats.attack || 0),
    magicAttack: (stats.intelligence * 2) + (equipmentStats.magicAttack || 0),
    defense: stats.endurance + Math.floor(stats.strength / 2) + (equipmentStats.defense || 0),
    dodge: (stats.agility * 0.5) + (equipmentStats.dodge || 0), // en %
    critical: ((stats.agility + stats.luck) * 0.3) + (equipmentStats.critical || 0) // en %
  };
}

/**
 * Ajoute de l'XP au personnage et gère le level up
 * @param {Object} character - Le personnage
 * @param {number} amount - Montant d'XP à ajouter
 * @returns {Object} Résultat avec infos de level up
 */
function addXp(character, amount) {
  const xpGained = Math.floor(amount * character.multipliers.xp);
  character.xp += xpGained;

  const result = {
    xpGained,
    leveledUp: false,
    levelsGained: 0,
    newLevel: character.level
  };

  // Vérifier les level up
  while (character.xp >= character.xpToNextLevel && character.level < 100) {
    character.xp -= character.xpToNextLevel;
    character.level++;
    character.statPoints += 5; // 5 points par niveau
    character.xpToNextLevel = Helpers.xpForLevel(character.level);

    result.leveledUp = true;
    result.levelsGained++;
    result.newLevel = character.level;
  }

  // Sauvegarder
  saveCharacter(character);

  return result;
}

/**
 * Ajoute de l'or au personnage
 * @param {Object} character - Le personnage
 * @param {number} amount - Montant d'or à ajouter
 */
function addGold(character, amount) {
  const goldGained = Math.floor(amount * character.multipliers.gold);
  character.gold += goldGained;
  saveCharacter(character);
  return goldGained;
}

/**
 * Retire de l'or au personnage
 * @param {Object} character - Le personnage
 * @param {number} amount - Montant d'or à retirer
 * @returns {boolean} True si assez d'or, false sinon
 */
function removeGold(character, amount) {
  if (character.gold < amount) {
    return false;
  }
  character.gold -= amount;
  saveCharacter(character);
  return true;
}

/**
 * Ajoute un point de stat
 * @param {Object} character - Le personnage
 * @param {string} stat - La stat à augmenter
 * @returns {boolean} True si réussi
 */
function addStatPoint(character, stat) {
  if (character.statPoints <= 0) {
    return false;
  }

  if (!character.baseStats.hasOwnProperty(stat)) {
    return false;
  }

  character.baseStats[stat]++;
  character.statPoints--;

  // Recalculer les stats dérivées
  const equipmentStats = getEquipmentStats();
  character.derivedStats = calculateDerivedStats(character.baseStats, equipmentStats);

  // Ajuster les HP actuels si max HP a changé
  const hpRatio = character.currentHp / (character.derivedStats.maxHp - 10);
  character.currentHp = Math.min(character.currentHp, character.derivedStats.maxHp);

  saveCharacter(character);
  return true;
}

/**
 * Récupère les stats totales de l'équipement
 * @returns {Object} Stats de l'équipement
 */
function getEquipmentStats() {
  const equipment = Storage.loadEquipment();
  const stats = {
    strength: 0,
    agility: 0,
    intelligence: 0,
    endurance: 0,
    luck: 0,
    maxHp: 0,
    attack: 0,
    magicAttack: 0,
    defense: 0,
    dodge: 0,
    critical: 0
  };

  for (const slot in equipment) {
    const item = equipment[slot];
    if (item && item.stats) {
      for (const stat in item.stats) {
        if (stats.hasOwnProperty(stat)) {
          stats[stat] += item.stats[stat];
        }
      }
    }
  }

  // Ajouter les bonus de sets
  const setResult = calculateSetBonuses(equipment);
  for (const stat in setResult.bonuses) {
    if (stats.hasOwnProperty(stat)) {
      stats[stat] += setResult.bonuses[stat];
    }
  }

  return stats;
}

/**
 * Met à jour les stats dérivées du personnage (appelé après changement d'équipement)
 * @param {Object} character - Le personnage
 */
function updateDerivedStats(character) {
  const equipmentStats = getEquipmentStats();
  character.derivedStats = calculateDerivedStats(character.baseStats, equipmentStats);
  character.currentHp = Math.min(character.currentHp, character.derivedStats.maxHp);
  saveCharacter(character);
}

/**
 * Soigne le personnage
 * @param {Object} character - Le personnage
 * @param {number} amount - Montant de soin (ou -1 pour full heal)
 */
function healCharacter(character, amount = -1) {
  if (amount === -1) {
    character.currentHp = character.derivedStats.maxHp;
  } else {
    character.currentHp = Math.min(character.currentHp + amount, character.derivedStats.maxHp);
  }
  saveCharacter(character);
}

/**
 * Sauvegarde le personnage dans localStorage
 * @param {Object} character - Le personnage à sauvegarder
 */
function saveCharacter(character) {
  character.lastSave = Date.now();
  Storage.saveCharacter(character);
}

/**
 * Charge le personnage depuis localStorage
 * @returns {Object|null} Le personnage ou null
 */
function loadCharacter() {
  return Storage.loadCharacter();
}

/**
 * Vérifie si un personnage existe
 * @returns {boolean}
 */
function hasCharacter() {
  return Storage.hasCharacter();
}

/**
 * Supprime le personnage (reset)
 */
function deleteCharacter() {
  Storage.clearAll();
}

// Export pour utilisation globale
window.ORIGINS = ORIGINS;
window.createCharacter = createCharacter;
window.calculateDerivedStats = calculateDerivedStats;
window.addXp = addXp;
window.addGold = addGold;
window.removeGold = removeGold;
window.addStatPoint = addStatPoint;
window.getEquipmentStats = getEquipmentStats;
window.updateDerivedStats = updateDerivedStats;
window.healCharacter = healCharacter;
window.saveCharacter = saveCharacter;
window.loadCharacter = loadCharacter;
window.hasCharacter = hasCharacter;
window.deleteCharacter = deleteCharacter;
