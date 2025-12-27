/* ==============================================
   ELANIA RPG - Système de Génération de Loot
   ============================================== */

/**
 * Sélectionne une rareté basée sur les poids
 * @param {number} luckBonus - Bonus de chance du joueur
 * @returns {string} Rareté sélectionnée
 */
function selectRarity(luckBonus = 0) {
  const rarities = Object.entries(RARITIES).map(([key, value]) => ({
    id: key,
    weight: value.dropWeight * (1 + luckBonus / 100)
  }));

  // Augmenter légèrement les chances des raretés supérieures avec la chance
  if (luckBonus > 0) {
    rarities.forEach((r, i) => {
      if (i > 0) { // Pas pour common
        r.weight *= (1 + luckBonus / 50);
      }
    });
  }

  return Helpers.weightedRandom(rarities).id;
}

/**
 * Génère les stats d'un item basées sur sa rareté et son niveau
 * @param {Object} template - Template de l'item
 * @param {string} rarity - Rareté de l'item
 * @param {number} level - Niveau de l'item
 * @returns {Object} Stats de l'item
 */
function generateItemStats(template, rarity, level) {
  const rarityData = RARITIES[rarity];
  const stats = {};

  for (const [stat, baseValue] of Object.entries(template.baseStats)) {
    // Formule: baseValue * multiplicateur de rareté * (1 + niveau * 0.1) * variation aléatoire
    const levelMultiplier = 1 + (level - 1) * 0.1;
    const variation = Helpers.randomFloat(0.9, 1.1);
    const finalValue = Math.floor(baseValue * rarityData.statMultiplier * levelMultiplier * variation);

    if (finalValue > 0) {
      stats[stat] = finalValue;
    }
  }

  // Chance d'avoir des stats bonus pour les items rares+
  if (['rare', 'epic', 'legendary', 'mythic'].includes(rarity)) {
    const bonusStats = ['strength', 'agility', 'intelligence', 'endurance', 'luck'];
    const numBonusStats = { rare: 1, epic: 2, legendary: 3, mythic: 4 }[rarity];

    for (let i = 0; i < numBonusStats; i++) {
      if (Helpers.checkChance(50)) { // 50% de chance par stat bonus
        const bonusStat = Helpers.randomElement(bonusStats);
        if (!stats[bonusStat]) {
          stats[bonusStat] = 0;
        }
        stats[bonusStat] += Helpers.randomInt(1, Math.ceil(level / 5) + 1);
      }
    }
  }

  return stats;
}

/**
 * Génère le nom d'un item
 * @param {Object} template - Template de l'item
 * @param {string} rarity - Rareté de l'item
 * @param {Object} stats - Stats de l'item
 * @returns {string} Nom généré
 */
function generateItemName(template, rarity, stats) {
  // Trouver la stat dominante pour le suffixe
  let dominantStat = 'strength';
  let maxValue = 0;

  for (const [stat, value] of Object.entries(stats)) {
    if (['strength', 'agility', 'intelligence', 'endurance', 'luck'].includes(stat) && value > maxValue) {
      maxValue = value;
      dominantStat = stat;
    }
  }

  // Sélectionner préfixe et suffixe
  const prefixes = ITEM_PREFIXES[rarity] || ITEM_PREFIXES.common;
  const suffixes = ITEM_SUFFIXES[dominantStat] || ITEM_SUFFIXES.strength;

  const prefix = Helpers.randomElement(prefixes);
  const suffix = Helpers.randomElement(suffixes);

  // Les items communs n'ont pas toujours de préfixe/suffixe
  if (rarity === 'common') {
    const roll = Math.random();
    if (roll < 0.4) {
      return template.baseName;
    } else if (roll < 0.7) {
      return `${prefix} ${template.baseName}`;
    }
  }

  return `${template.baseName} ${suffix}`;
}

/**
 * Génère un item complet
 * @param {string} slot - Slot de l'item
 * @param {number} level - Niveau de l'item
 * @param {string} forcedRarity - Rareté forcée (optionnel)
 * @param {number} luckBonus - Bonus de chance
 * @returns {Object} Item généré
 */
function generateItem(slot, level, forcedRarity = null, luckBonus = 0) {
  // Sélectionner le template
  const templates = ITEM_TEMPLATES[slot];
  if (!templates || templates.length === 0) {
    console.error(`Pas de templates pour le slot ${slot}`);
    return null;
  }

  const template = Helpers.randomElement(templates);

  // Déterminer la rareté
  const rarity = forcedRarity || selectRarity(luckBonus);

  // Générer les stats
  const stats = generateItemStats(template, rarity, level);

  // Générer le nom
  const name = generateItemName(template, rarity, stats);

  return {
    id: Helpers.generateId(),
    name,
    slot,
    rarity,
    levelRequired: Math.max(1, level - 2),
    icon: template.icon,
    stats,
    // Optionnel: appartenance à un set
    setId: Helpers.checkChance(10) ? getRandomSetForSlot(slot) : null
  };
}

/**
 * Récupère un set aléatoire compatible avec un slot
 * @param {string} slot - Slot de l'item
 * @returns {string|null} ID du set ou null
 */
function getRandomSetForSlot(slot) {
  const compatibleSets = Object.values(EQUIPMENT_SETS).filter(set =>
    set.pieces.includes(slot)
  );

  if (compatibleSets.length === 0) {
    return null;
  }

  return Helpers.randomElement(compatibleSets).id;
}

/**
 * Génère le loot d'une expédition
 * @param {Object} zone - Zone d'expédition
 * @param {number} playerLevel - Niveau du joueur
 * @param {number} luckBonus - Bonus de chance du joueur
 * @returns {Array} Items générés
 */
function generateExpeditionLoot(zone, playerLevel, luckBonus = 0) {
  const loot = [];

  // Vérifier si on a un loot
  const lootChance = zone.lootChance * 100 * (1 + luckBonus / 100);

  if (!Helpers.checkChance(lootChance)) {
    return loot;
  }

  // Générer 1 à 2 items
  const numItems = Helpers.checkChance(20 + luckBonus) ? 2 : 1;

  for (let i = 0; i < numItems; i++) {
    const slot = Helpers.randomElement(zone.lootTable);
    const itemLevel = calculateMonsterLevel(zone, playerLevel);
    const item = generateItem(slot, itemLevel, null, luckBonus);

    if (item) {
      loot.push(item);
    }
  }

  return loot;
}

/**
 * Génère un item de boss (rareté garantie supérieure)
 * @param {Object} zone - Zone du boss
 * @param {number} playerLevel - Niveau du joueur
 * @returns {Object} Item généré
 */
function generateBossLoot(zone, playerLevel) {
  const slot = Helpers.randomElement(zone.lootTable);

  // Les boss droppent minimum rare
  const rarityRoll = Math.random();
  let rarity;
  if (rarityRoll < 0.5) {
    rarity = 'rare';
  } else if (rarityRoll < 0.8) {
    rarity = 'epic';
  } else if (rarityRoll < 0.95) {
    rarity = 'legendary';
  } else {
    rarity = 'mythic';
  }

  return generateItem(slot, zone.levelMax, rarity);
}

/**
 * Formate les stats d'un item pour l'affichage
 * @param {Object} item - L'item
 * @returns {Array} Lignes de stats formatées
 */
function formatItemStats(item) {
  const lines = [];
  const statNames = {
    strength: 'Force',
    agility: 'Agilité',
    intelligence: 'Intelligence',
    endurance: 'Endurance',
    luck: 'Chance',
    maxHp: 'PV max',
    attack: 'Attaque',
    magicAttack: 'Attaque magique',
    defense: 'Défense',
    dodge: 'Esquive',
    critical: 'Critique'
  };

  for (const [stat, value] of Object.entries(item.stats)) {
    const name = statNames[stat] || stat;
    const sign = value > 0 ? '+' : '';
    const suffix = ['dodge', 'critical'].includes(stat) ? '%' : '';
    lines.push(`${sign}${value}${suffix} ${name}`);
  }

  return lines;
}

// Export pour utilisation globale
window.selectRarity = selectRarity;
window.generateItem = generateItem;
window.generateExpeditionLoot = generateExpeditionLoot;
window.generateBossLoot = generateBossLoot;
window.formatItemStats = formatItemStats;
