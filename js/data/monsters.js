/* ==============================================
   ELANIA RPG - Base de données des Monstres
   ============================================== */

const MONSTERS = {
  // Zone 1: Forêt de Branwald (Niveau 1-10)
  branwald: [
    {
      id: 'wolf',
      name: 'Loup',
      icon: '🐺',
      baseStats: { strength: 3, agility: 4, endurance: 2, intelligence: 1, luck: 1 },
      xpReward: 15,
      goldReward: { min: 5, max: 15 }
    },
    {
      id: 'bandit',
      name: 'Bandit',
      icon: '🗡️',
      baseStats: { strength: 4, agility: 3, endurance: 3, intelligence: 2, luck: 2 },
      xpReward: 20,
      goldReward: { min: 10, max: 30 }
    },
    {
      id: 'bear',
      name: 'Ours',
      icon: '🐻',
      baseStats: { strength: 6, agility: 2, endurance: 5, intelligence: 1, luck: 1 },
      xpReward: 30,
      goldReward: { min: 15, max: 40 }
    },
    {
      id: 'forest_troll',
      name: 'Troll des bois',
      icon: '👹',
      baseStats: { strength: 7, agility: 1, endurance: 6, intelligence: 1, luck: 1 },
      xpReward: 40,
      goldReward: { min: 20, max: 50 }
    }
  ],

  // Boss Zone 1
  branwald_boss: {
    id: 'bandit_chief',
    name: 'Chef des Bandits',
    icon: '⚔️',
    baseStats: { strength: 8, agility: 5, endurance: 7, intelligence: 4, luck: 3 },
    xpReward: 100,
    goldReward: { min: 50, max: 150 },
    isBoss: true
  },

  // Zone 2: Marais de Sombrefange (Niveau 10-20)
  sombrefange: [
    {
      id: 'zombie',
      name: 'Zombie',
      icon: '🧟',
      baseStats: { strength: 5, agility: 1, endurance: 6, intelligence: 1, luck: 1 },
      xpReward: 35,
      goldReward: { min: 15, max: 35 }
    },
    {
      id: 'skeleton',
      name: 'Squelette',
      icon: '💀',
      baseStats: { strength: 4, agility: 4, endurance: 4, intelligence: 2, luck: 2 },
      xpReward: 40,
      goldReward: { min: 20, max: 45 }
    },
    {
      id: 'swamp_witch',
      name: 'Sorcière des marais',
      icon: '🧙‍♀️',
      baseStats: { strength: 2, agility: 3, endurance: 4, intelligence: 8, luck: 3 },
      xpReward: 55,
      goldReward: { min: 30, max: 60 }
    },
    {
      id: 'ghoul',
      name: 'Goule',
      icon: '👻',
      baseStats: { strength: 6, agility: 5, endurance: 5, intelligence: 2, luck: 2 },
      xpReward: 50,
      goldReward: { min: 25, max: 55 }
    }
  ],

  // Boss Zone 2
  sombrefange_boss: {
    id: 'necromancer',
    name: 'Nécromancien',
    icon: '☠️',
    baseStats: { strength: 3, agility: 4, endurance: 8, intelligence: 12, luck: 5 },
    xpReward: 200,
    goldReward: { min: 100, max: 300 },
    isBoss: true
  }
};

/**
 * Génère les stats d'un monstre basé sur le niveau
 * @param {Object} monster - Template du monstre
 * @param {number} level - Niveau du monstre
 * @returns {Object} Monstre avec stats ajustées
 */
function generateMonster(monster, level) {
  const levelMultiplier = 1 + (level - 1) * 0.15;

  const stats = {
    strength: Math.floor(monster.baseStats.strength * levelMultiplier),
    agility: Math.floor(monster.baseStats.agility * levelMultiplier),
    endurance: Math.floor(monster.baseStats.endurance * levelMultiplier),
    intelligence: Math.floor(monster.baseStats.intelligence * levelMultiplier),
    luck: Math.floor(monster.baseStats.luck * levelMultiplier)
  };

  // Calcul des stats dérivées
  const derivedStats = {
    maxHp: 50 + (stats.endurance * 10),
    attack: stats.strength * 2,
    magicAttack: stats.intelligence * 2,
    defense: stats.endurance + Math.floor(stats.strength / 2),
    dodge: stats.agility * 0.5,
    critical: (stats.agility + stats.luck) * 0.3
  };

  return {
    ...monster,
    level,
    stats,
    derivedStats,
    currentHp: derivedStats.maxHp,
    xpReward: Math.floor(monster.xpReward * levelMultiplier),
    goldReward: {
      min: Math.floor(monster.goldReward.min * levelMultiplier),
      max: Math.floor(monster.goldReward.max * levelMultiplier)
    }
  };
}

/**
 * Sélectionne un monstre aléatoire pour une zone et un niveau
 * @param {string} zoneId - ID de la zone
 * @param {number} level - Niveau approximatif
 * @returns {Object} Monstre généré
 */
function getRandomMonster(zoneId, level) {
  const zoneMonsters = MONSTERS[zoneId];
  if (!zoneMonsters || !Array.isArray(zoneMonsters)) {
    console.error(`Zone ${zoneId} non trouvée`);
    return null;
  }

  const monsterTemplate = Helpers.randomElement(zoneMonsters);
  return generateMonster(monsterTemplate, level);
}

/**
 * Récupère le boss d'une zone
 * @param {string} zoneId - ID de la zone
 * @param {number} level - Niveau du boss
 * @returns {Object} Boss généré
 */
function getZoneBoss(zoneId, level) {
  const bossTemplate = MONSTERS[`${zoneId}_boss`];
  if (!bossTemplate) {
    console.error(`Boss de zone ${zoneId} non trouvé`);
    return null;
  }

  return generateMonster(bossTemplate, level);
}

// Export pour utilisation globale
window.MONSTERS = MONSTERS;
window.generateMonster = generateMonster;
window.getRandomMonster = getRandomMonster;
window.getZoneBoss = getZoneBoss;
