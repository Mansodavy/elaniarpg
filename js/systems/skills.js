/* ==============================================
   ELANIA RPG - Système de Compétences
   ============================================== */

/**
 * Définition des compétences de base
 */
const SKILLS = {
  // Compétences de base (toujours disponibles)
  attack: {
    id: 'attack',
    name: 'Attaque',
    icon: '⚔️',
    description: 'Attaque standard basée sur votre force',
    type: 'damage',
    cooldown: 0,
    manaCost: 0,
    damageMultiplier: 1.0,
    effects: []
  },

  defend: {
    id: 'defend',
    name: 'Défense',
    icon: '🛡️',
    description: 'Réduit les dégâts reçus de 50% pendant ce tour',
    type: 'buff',
    cooldown: 2,
    manaCost: 0,
    effects: [{
      type: 'damageReduction',
      value: 0.5,
      duration: 1
    }]
  },

  // Compétences offensives
  powerStrike: {
    id: 'powerStrike',
    name: 'Frappe Puissante',
    icon: '💥',
    description: 'Une attaque dévastatrice infligeant 150% de dégâts',
    type: 'damage',
    cooldown: 3,
    manaCost: 10,
    damageMultiplier: 1.5,
    effects: []
  },

  fireball: {
    id: 'fireball',
    name: 'Boule de Feu',
    icon: '🔥',
    description: 'Lance une boule de feu infligeant des dégâts magiques',
    type: 'magic',
    cooldown: 2,
    manaCost: 15,
    damageMultiplier: 1.3,
    effects: [{
      type: 'burn',
      value: 5,
      duration: 2
    }]
  },

  iceSpear: {
    id: 'iceSpear',
    name: 'Lance de Glace',
    icon: '❄️',
    description: 'Lance de glace qui ralentit l\'ennemi',
    type: 'magic',
    cooldown: 2,
    manaCost: 12,
    damageMultiplier: 1.2,
    effects: [{
      type: 'slow',
      value: 0.3,
      duration: 2
    }]
  },

  // Compétences défensives/utilitaires
  heal: {
    id: 'heal',
    name: 'Soin',
    icon: '💚',
    description: 'Restaure 30% de vos PV maximum',
    type: 'heal',
    cooldown: 4,
    manaCost: 20,
    healPercent: 0.3,
    effects: []
  },

  rage: {
    id: 'rage',
    name: 'Rage',
    icon: '😤',
    description: 'Augmente vos dégâts de 30% pendant 3 tours',
    type: 'buff',
    cooldown: 5,
    manaCost: 15,
    effects: [{
      type: 'damageBoost',
      value: 0.3,
      duration: 3
    }]
  },

  // Potion (consommable limité)
  potion: {
    id: 'potion',
    name: 'Potion',
    icon: '🧪',
    description: 'Restaure 50% de vos PV (limité à 2 par combat)',
    type: 'consumable',
    cooldown: 0,
    maxUses: 2,
    healPercent: 0.5,
    effects: []
  }
};

/**
 * Compétences par origine
 */
const ORIGIN_SKILLS = {
  peasant: ['attack', 'defend', 'potion'],
  soldier: ['attack', 'defend', 'powerStrike', 'rage', 'potion'],
  mage: ['attack', 'defend', 'fireball', 'iceSpear', 'heal', 'potion'],
  noble: ['attack', 'defend', 'powerStrike', 'heal', 'potion']
};

/**
 * Récupère les compétences disponibles pour un personnage
 * @param {Object} character - Le personnage
 * @returns {Array} Liste des compétences disponibles
 */
function getAvailableSkills(character) {
  const origin = character.origin || 'peasant';
  const skillIds = ORIGIN_SKILLS[origin] || ORIGIN_SKILLS.peasant;

  return skillIds.map(id => ({
    ...SKILLS[id],
    currentCooldown: 0,
    usesRemaining: SKILLS[id].maxUses || Infinity
  }));
}

/**
 * Crée l'état des compétences pour un combat
 * @param {Object} character - Le personnage
 * @returns {Object} État des compétences
 */
function createCombatSkillState(character) {
  const skills = getAvailableSkills(character);

  return {
    skills: skills,
    mana: 50, // Mana de départ
    maxMana: 50 + (character.baseStats.intelligence * 2),
    manaRegen: 5 + Math.floor(character.baseStats.intelligence / 3),
    activeEffects: []
  };
}

/**
 * Vérifie si une compétence peut être utilisée
 * @param {Object} skillState - État des compétences
 * @param {string} skillId - ID de la compétence
 * @returns {Object} Résultat de la vérification
 */
function canUseSkill(skillState, skillId) {
  const skill = skillState.skills.find(s => s.id === skillId);

  if (!skill) {
    return { canUse: false, reason: 'Compétence inconnue' };
  }

  if (skill.currentCooldown > 0) {
    return { canUse: false, reason: `Cooldown: ${skill.currentCooldown} tours` };
  }

  if (skill.manaCost > skillState.mana) {
    return { canUse: false, reason: 'Mana insuffisant' };
  }

  if (skill.maxUses && skill.usesRemaining <= 0) {
    return { canUse: false, reason: 'Plus d\'utilisations' };
  }

  return { canUse: true };
}

/**
 * Utilise une compétence
 * @param {Object} skillState - État des compétences
 * @param {string} skillId - ID de la compétence
 * @param {Object} user - Utilisateur de la compétence
 * @param {Object} target - Cible de la compétence
 * @returns {Object} Résultat de l'utilisation
 */
function useSkill(skillState, skillId, user, target) {
  const skill = skillState.skills.find(s => s.id === skillId);
  const check = canUseSkill(skillState, skillId);

  if (!check.canUse) {
    return { success: false, message: check.reason };
  }

  // Consommer le mana et appliquer le cooldown
  skillState.mana -= skill.manaCost;
  skill.currentCooldown = skill.cooldown;

  if (skill.maxUses) {
    skill.usesRemaining--;
  }

  const result = {
    success: true,
    skill: skill,
    damage: 0,
    healing: 0,
    effects: [],
    message: ''
  };

  // Calculer les effets selon le type
  switch (skill.type) {
    case 'damage':
      result.damage = calculateSkillDamage(skill, user, target, 'physical');
      result.message = `${user.name} utilise ${skill.name} et inflige ${result.damage} dégâts !`;
      break;

    case 'magic':
      result.damage = calculateSkillDamage(skill, user, target, 'magic');
      result.message = `${user.name} lance ${skill.name} et inflige ${result.damage} dégâts magiques !`;
      break;

    case 'heal':
      result.healing = Math.floor(user.maxHp * skill.healPercent);
      result.message = `${user.name} utilise ${skill.name} et récupère ${result.healing} PV !`;
      break;

    case 'consumable':
      result.healing = Math.floor(user.maxHp * skill.healPercent);
      result.message = `${user.name} boit une ${skill.name} et récupère ${result.healing} PV !`;
      break;

    case 'buff':
      result.message = `${user.name} utilise ${skill.name} !`;
      break;
  }

  // Appliquer les effets
  if (skill.effects && skill.effects.length > 0) {
    skill.effects.forEach(effect => {
      const newEffect = {
        ...effect,
        remainingDuration: effect.duration,
        source: skillId
      };

      if (effect.type === 'damageReduction' || effect.type === 'damageBoost') {
        skillState.activeEffects.push(newEffect);
        result.effects.push(newEffect);
      } else if (effect.type === 'burn' || effect.type === 'slow') {
        // Effets sur la cible (à gérer côté ennemi)
        result.targetEffects = result.targetEffects || [];
        result.targetEffects.push(newEffect);
      }
    });
  }

  return result;
}

/**
 * Calcule les dégâts d'une compétence
 * @param {Object} skill - La compétence
 * @param {Object} user - L'utilisateur
 * @param {Object} target - La cible
 * @param {string} damageType - Type de dégâts
 * @returns {number} Dégâts calculés
 */
function calculateSkillDamage(skill, user, target, damageType) {
  let baseDamage;

  if (damageType === 'magic') {
    baseDamage = user.stats.magicAttack || user.stats.attack;
  } else {
    baseDamage = user.stats.attack;
  }

  // Appliquer le multiplicateur
  let damage = Math.floor(baseDamage * skill.damageMultiplier);

  // Variation aléatoire (±10%)
  damage = Math.floor(damage * Helpers.randomFloat(0.9, 1.1));

  // Vérifier le critique
  let isCritical = false;
  if (Helpers.checkChance(user.stats.critical)) {
    isCritical = true;
    damage = Math.floor(damage * 2);
  }

  // Appliquer la défense
  const defense = Math.floor(target.stats.defense * 0.5);
  damage = Math.max(1, damage - defense);

  return damage;
}

/**
 * Met à jour les cooldowns en fin de tour
 * @param {Object} skillState - État des compétences
 */
function updateCooldowns(skillState) {
  skillState.skills.forEach(skill => {
    if (skill.currentCooldown > 0) {
      skill.currentCooldown--;
    }
  });

  // Régénérer le mana
  skillState.mana = Math.min(skillState.maxMana, skillState.mana + skillState.manaRegen);

  // Mettre à jour les effets actifs
  skillState.activeEffects = skillState.activeEffects.filter(effect => {
    effect.remainingDuration--;
    return effect.remainingDuration > 0;
  });
}

/**
 * Récupère le modificateur de dégâts actif
 * @param {Object} skillState - État des compétences
 * @returns {number} Modificateur total
 */
function getDamageModifier(skillState) {
  let modifier = 1.0;

  skillState.activeEffects.forEach(effect => {
    if (effect.type === 'damageBoost') {
      modifier += effect.value;
    }
  });

  return modifier;
}

/**
 * Récupère le modificateur de réduction de dégâts actif
 * @param {Object} skillState - État des compétences
 * @returns {number} Modificateur de réduction
 */
function getDamageReduction(skillState) {
  let reduction = 0;

  skillState.activeEffects.forEach(effect => {
    if (effect.type === 'damageReduction') {
      reduction += effect.value;
    }
  });

  return Math.min(0.9, reduction); // Max 90% de réduction
}

// Export pour utilisation globale
window.SKILLS = SKILLS;
window.ORIGIN_SKILLS = ORIGIN_SKILLS;
window.getAvailableSkills = getAvailableSkills;
window.createCombatSkillState = createCombatSkillState;
window.canUseSkill = canUseSkill;
window.useSkill = useSkill;
window.updateCooldowns = updateCooldowns;
window.getDamageModifier = getDamageModifier;
window.getDamageReduction = getDamageReduction;
