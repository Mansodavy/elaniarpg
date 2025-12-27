/* ==============================================
   ELANIA RPG - Bonus de Sets d'équipement
   ============================================== */

// Sets d'équipement avec leurs bonus
const EQUIPMENT_SETS = {
  forest_guardian: {
    id: 'forest_guardian',
    name: 'Gardien de la Forêt',
    pieces: ['head', 'chest', 'legs', 'feet', 'hands'],
    bonuses: {
      2: { agility: 3, description: '+3 Agilité' },
      4: { endurance: 5, dodge: 5, description: '+5 Endurance, +5% Esquive' },
      5: { strength: 5, agility: 5, endurance: 5, description: '+5 à toutes les stats physiques' }
    }
  },

  shadow_assassin: {
    id: 'shadow_assassin',
    name: 'Assassin des Ombres',
    pieces: ['head', 'chest', 'hands', 'mainHand', 'offHand'],
    bonuses: {
      2: { agility: 4, description: '+4 Agilité' },
      3: { critical: 10, description: '+10% Critique' },
      5: { agility: 8, luck: 5, description: '+8 Agilité, +5 Chance' }
    }
  },

  arcane_scholar: {
    id: 'arcane_scholar',
    name: 'Érudit des Arcanes',
    pieces: ['head', 'chest', 'mainHand', 'amulet', 'ring1'],
    bonuses: {
      2: { intelligence: 4, description: '+4 Intelligence' },
      3: { magicAttack: 15, description: '+15 Attaque magique' },
      5: { intelligence: 10, luck: 5, description: '+10 Intelligence, +5 Chance' }
    }
  },

  iron_wall: {
    id: 'iron_wall',
    name: 'Mur de Fer',
    pieces: ['head', 'chest', 'legs', 'feet', 'offHand'],
    bonuses: {
      2: { endurance: 5, description: '+5 Endurance' },
      3: { defense: 20, description: '+20 Défense' },
      5: { endurance: 10, maxHp: 100, description: '+10 Endurance, +100 PV max' }
    }
  },

  fortune_seeker: {
    id: 'fortune_seeker',
    name: 'Chercheur de Fortune',
    pieces: ['amulet', 'ring1', 'ring2'],
    bonuses: {
      2: { luck: 5, description: '+5 Chance' },
      3: { goldBonus: 20, xpBonus: 10, description: '+20% Or, +10% XP' }
    }
  }
};

/**
 * Vérifie si un item appartient à un set
 * @param {Object} item - L'item à vérifier
 * @returns {string|null} ID du set ou null
 */
function getItemSetId(item) {
  if (!item || !item.setId) return null;
  return item.setId;
}

/**
 * Compte les pièces de set équipées
 * @param {Object} equipment - Équipement actuel
 * @param {string} setId - ID du set
 * @returns {number} Nombre de pièces équipées
 */
function countSetPieces(equipment, setId) {
  let count = 0;
  for (const slot in equipment) {
    const item = equipment[slot];
    if (item && item.setId === setId) {
      count++;
    }
  }
  return count;
}

/**
 * Calcule les bonus de sets actifs
 * @param {Object} equipment - Équipement actuel
 * @returns {Object} Bonus totaux des sets
 */
function calculateSetBonuses(equipment) {
  const bonuses = {
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
    critical: 0,
    goldBonus: 0,
    xpBonus: 0
  };

  const activeSets = [];

  // Parcourir tous les sets possibles
  for (const setId in EQUIPMENT_SETS) {
    const set = EQUIPMENT_SETS[setId];
    const pieceCount = countSetPieces(equipment, setId);

    if (pieceCount >= 2) {
      const setInfo = {
        name: set.name,
        pieces: pieceCount,
        activeBonus: []
      };

      // Appliquer les bonus selon le nombre de pièces
      for (const threshold in set.bonuses) {
        if (pieceCount >= parseInt(threshold)) {
          const bonus = set.bonuses[threshold];
          setInfo.activeBonus.push(bonus.description);

          // Appliquer chaque bonus
          for (const stat in bonus) {
            if (stat !== 'description' && bonuses.hasOwnProperty(stat)) {
              bonuses[stat] += bonus[stat];
            }
          }
        }
      }

      activeSets.push(setInfo);
    }
  }

  return { bonuses, activeSets };
}

/**
 * Récupère les informations d'un set
 * @param {string} setId - ID du set
 * @returns {Object|null} Informations du set
 */
function getSetInfo(setId) {
  return EQUIPMENT_SETS[setId] || null;
}

// Export pour utilisation globale
window.EQUIPMENT_SETS = EQUIPMENT_SETS;
window.getItemSetId = getItemSetId;
window.countSetPieces = countSetPieces;
window.calculateSetBonuses = calculateSetBonuses;
window.getSetInfo = getSetInfo;
