/* ==============================================
   ELANIA RPG - Base de données des Zones
   ============================================== */

const ZONES = {
  branwald: {
    id: 'branwald',
    name: 'Forêt de Branwald',
    icon: '🌲',
    description: 'Une forêt dense où rôdent loups et bandits. Les voyageurs imprudents y disparaissent souvent sans laisser de traces.',
    levelMin: 1,
    levelMax: 10,
    expeditionTime: 60, // secondes (60s pour le dev, 300s en prod)
    difficulty: 1,
    monsters: ['wolf', 'bandit', 'bear', 'forest_troll'],
    bossId: 'bandit_chief',
    bossChance: 0.1, // 10% de chance de rencontrer le boss
    lootTable: ['mainHand', 'offHand', 'chest', 'legs', 'hands', 'feet', 'head'],
    lootChance: 0.4, // 40% de chance de loot
    background: '#1a3a1a'
  },

  sombrefange: {
    id: 'sombrefange',
    name: 'Marais de Sombrefange',
    icon: '🏚️',
    description: 'Des terres corrompues par la nécromancie. Les morts-vivants errent sans fin dans ces brumes empoisonnées.',
    levelMin: 10,
    levelMax: 20,
    expeditionTime: 120, // secondes
    difficulty: 2,
    monsters: ['zombie', 'skeleton', 'swamp_witch', 'ghoul'],
    bossId: 'necromancer',
    bossChance: 0.1,
    lootTable: ['amulet', 'ring1', 'ring2', 'mainHand', 'head', 'chest'],
    lootChance: 0.35,
    background: '#2a1a2a'
  },

  // Zones futures (placeholder)
  cryptes: {
    id: 'cryptes',
    name: 'Cryptes de Valdris',
    icon: '⚰️',
    description: 'Les tombeaux oubliés d\'une ancienne civilisation. Des trésors y dorment aux côtés de gardiens immortels.',
    levelMin: 20,
    levelMax: 30,
    expeditionTime: 180,
    difficulty: 3,
    monsters: [],
    bossId: null,
    bossChance: 0.1,
    lootTable: [],
    lootChance: 0.3,
    locked: true, // Zone non disponible
    unlockMessage: 'Atteignez le niveau 20 pour débloquer cette zone.',
    background: '#1a1a2e'
  },

  volcan: {
    id: 'volcan',
    name: 'Mont Igneus',
    icon: '🌋',
    description: 'Un volcan actif où les démons de feu règnent en maîtres. Seuls les plus braves osent s\'y aventurer.',
    levelMin: 30,
    levelMax: 40,
    expeditionTime: 240,
    difficulty: 4,
    monsters: [],
    bossId: null,
    bossChance: 0.1,
    lootTable: [],
    lootChance: 0.25,
    locked: true,
    unlockMessage: 'Atteignez le niveau 30 pour débloquer cette zone.',
    background: '#3a1a0a'
  }
};

/**
 * Vérifie si une zone est accessible pour un niveau donné
 * @param {string} zoneId - ID de la zone
 * @param {number} level - Niveau du joueur
 * @returns {boolean}
 */
function isZoneAccessible(zoneId, level) {
  const zone = ZONES[zoneId];
  if (!zone) return false;
  if (zone.locked) return false;
  return level >= zone.levelMin;
}

/**
 * Récupère toutes les zones accessibles pour un niveau
 * @param {number} level - Niveau du joueur
 * @returns {Array} Zones accessibles
 */
function getAccessibleZones(level) {
  return Object.values(ZONES).filter(zone => isZoneAccessible(zone.id, level));
}

/**
 * Calcule le niveau du monstre dans une zone basé sur le niveau du joueur
 * @param {Object} zone - Zone d'expédition
 * @param {number} playerLevel - Niveau du joueur
 * @returns {number} Niveau du monstre
 */
function calculateMonsterLevel(zone, playerLevel) {
  // Le monstre est dans la fourchette de niveau de la zone
  // et proche du niveau du joueur
  const minLevel = zone.levelMin;
  const maxLevel = zone.levelMax;

  // Le monstre est entre -2 et +2 niveaux du joueur, dans les limites de la zone
  const baseLevel = Helpers.clamp(playerLevel, minLevel, maxLevel);
  const variation = Helpers.randomInt(-2, 2);

  return Helpers.clamp(baseLevel + variation, minLevel, maxLevel);
}

/**
 * Détermine les récompenses d'une expédition
 * @param {Object} zone - Zone d'expédition
 * @param {number} playerLevel - Niveau du joueur
 * @param {boolean} victory - Victoire ou défaite
 * @returns {Object} Récompenses
 */
function calculateExpeditionRewards(zone, playerLevel, victory) {
  const baseXp = 20 * zone.difficulty;
  const baseGold = 10 * zone.difficulty;

  if (!victory) {
    return {
      xp: Math.floor(baseXp * 0.3), // XP réduit en cas de défaite
      gold: 0,
      loot: null
    };
  }

  const xpMultiplier = 1 + (playerLevel * 0.1);
  const goldMultiplier = 1 + (playerLevel * 0.05);

  return {
    xp: Math.floor(baseXp * xpMultiplier * Helpers.randomFloat(0.8, 1.2)),
    gold: Math.floor(baseGold * goldMultiplier * Helpers.randomFloat(0.8, 1.2)),
    loot: Helpers.checkChance(zone.lootChance * 100) ? zone.lootTable : null
  };
}

// Export pour utilisation globale
window.ZONES = ZONES;
window.isZoneAccessible = isZoneAccessible;
window.getAccessibleZones = getAccessibleZones;
window.calculateMonsterLevel = calculateMonsterLevel;
window.calculateExpeditionRewards = calculateExpeditionRewards;
