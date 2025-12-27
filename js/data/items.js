/* ==============================================
   ELANIA RPG - Base de données des Items
   ============================================== */

// Constantes de rareté
const RARITIES = {
  common:    { name: 'Commun',     color: '#9d9d9d', statMultiplier: 1.0,  dropWeight: 60 },
  uncommon:  { name: 'Inhabituel', color: '#1eff00', statMultiplier: 1.3,  dropWeight: 25 },
  rare:      { name: 'Rare',       color: '#0070dd', statMultiplier: 1.6,  dropWeight: 10 },
  epic:      { name: 'Épique',     color: '#a335ee', statMultiplier: 2.0,  dropWeight: 4 },
  legendary: { name: 'Légendaire', color: '#ff8000', statMultiplier: 2.5,  dropWeight: 0.9 },
  mythic:    { name: 'Mythique',   color: '#e6cc80', statMultiplier: 3.0,  dropWeight: 0.1 }
};

// Types de slots d'équipement
const EQUIPMENT_SLOTS = {
  head: { name: 'Tête', icon: '🪖' },
  chest: { name: 'Torse', icon: '🛡️' },
  hands: { name: 'Mains', icon: '🧤' },
  legs: { name: 'Jambes', icon: '👖' },
  feet: { name: 'Pieds', icon: '👢' },
  mainHand: { name: 'Arme principale', icon: '⚔️' },
  offHand: { name: 'Main secondaire', icon: '🛡️' },
  amulet: { name: 'Amulette', icon: '📿' },
  ring1: { name: 'Anneau 1', icon: '💍' },
  ring2: { name: 'Anneau 2', icon: '💍' }
};

// Templates d'items par type
const ITEM_TEMPLATES = {
  // Armures de tête
  head: [
    { baseName: 'Capuche', icon: '🎭', baseStats: { endurance: 2, intelligence: 1 } },
    { baseName: 'Casque', icon: '🪖', baseStats: { endurance: 3, strength: 1 } },
    { baseName: 'Heaume', icon: '⛑️', baseStats: { endurance: 4 } },
    { baseName: 'Couronne', icon: '👑', baseStats: { intelligence: 3, luck: 2 } },
    { baseName: 'Bandeau', icon: '🎀', baseStats: { agility: 2, luck: 1 } }
  ],

  // Armures de torse
  chest: [
    { baseName: 'Tunique', icon: '👕', baseStats: { endurance: 3, agility: 1 } },
    { baseName: 'Plastron', icon: '🦺', baseStats: { endurance: 5, strength: 1 } },
    { baseName: 'Robe', icon: '👘', baseStats: { intelligence: 4, endurance: 2 } },
    { baseName: 'Armure de cuir', icon: '🧥', baseStats: { endurance: 4, agility: 2 } },
    { baseName: 'Cotte de mailles', icon: '🛡️', baseStats: { endurance: 6 } }
  ],

  // Gants
  hands: [
    { baseName: 'Gants', icon: '🧤', baseStats: { agility: 2 } },
    { baseName: 'Gantelets', icon: '🥊', baseStats: { strength: 2, endurance: 1 } },
    { baseName: 'Mitaines', icon: '🧤', baseStats: { agility: 1, luck: 1 } },
    { baseName: 'Bracelets', icon: '⌚', baseStats: { strength: 1, agility: 1 } }
  ],

  // Jambières
  legs: [
    { baseName: 'Pantalon', icon: '👖', baseStats: { endurance: 2, agility: 1 } },
    { baseName: 'Jambières', icon: '🦵', baseStats: { endurance: 4 } },
    { baseName: 'Cuissardes', icon: '🦿', baseStats: { strength: 2, endurance: 2 } },
    { baseName: 'Jupon magique', icon: '🩱', baseStats: { intelligence: 3, agility: 1 } }
  ],

  // Bottes
  feet: [
    { baseName: 'Bottes', icon: '👢', baseStats: { agility: 2, endurance: 1 } },
    { baseName: 'Sandales', icon: '🩴', baseStats: { agility: 3 } },
    { baseName: 'Chausses', icon: '🥾', baseStats: { endurance: 2, agility: 1 } },
    { baseName: 'Grèves', icon: '🦶', baseStats: { endurance: 3 } }
  ],

  // Armes principales
  mainHand: [
    { baseName: 'Épée', icon: '⚔️', baseStats: { strength: 4, agility: 1 } },
    { baseName: 'Hache', icon: '🪓', baseStats: { strength: 5 } },
    { baseName: 'Masse', icon: '🔨', baseStats: { strength: 4, endurance: 1 } },
    { baseName: 'Dague', icon: '🗡️', baseStats: { agility: 4, luck: 2 } },
    { baseName: 'Arc', icon: '🏹', baseStats: { agility: 3, luck: 2 } },
    { baseName: 'Bâton', icon: '🪄', baseStats: { intelligence: 5 } },
    { baseName: 'Sceptre', icon: '🔮', baseStats: { intelligence: 4, luck: 1 } }
  ],

  // Main secondaire
  offHand: [
    { baseName: 'Bouclier', icon: '🛡️', baseStats: { endurance: 4 } },
    { baseName: 'Écu', icon: '🛡️', baseStats: { endurance: 5, strength: 1 } },
    { baseName: 'Orbe', icon: '🔮', baseStats: { intelligence: 3, luck: 1 } },
    { baseName: 'Tome', icon: '📕', baseStats: { intelligence: 4 } },
    { baseName: 'Dague', icon: '🗡️', baseStats: { agility: 3, strength: 1 } }
  ],

  // Amulettes
  amulet: [
    { baseName: 'Amulette', icon: '📿', baseStats: { luck: 2, intelligence: 1 } },
    { baseName: 'Pendentif', icon: '⚜️', baseStats: { endurance: 2, luck: 1 } },
    { baseName: 'Collier', icon: '📿', baseStats: { agility: 2, luck: 1 } },
    { baseName: 'Talisman', icon: '🔯', baseStats: { intelligence: 2, luck: 2 } }
  ],

  // Anneaux
  ring1: [
    { baseName: 'Anneau', icon: '💍', baseStats: { luck: 2 } },
    { baseName: 'Chevalière', icon: '💎', baseStats: { strength: 2 } },
    { baseName: 'Alliance', icon: '💍', baseStats: { endurance: 1, luck: 1 } },
    { baseName: 'Bague', icon: '💍', baseStats: { agility: 1, intelligence: 1 } }
  ],

  ring2: [
    { baseName: 'Anneau', icon: '💍', baseStats: { luck: 2 } },
    { baseName: 'Chevalière', icon: '💎', baseStats: { strength: 2 } },
    { baseName: 'Alliance', icon: '💍', baseStats: { endurance: 1, luck: 1 } },
    { baseName: 'Bague', icon: '💍', baseStats: { agility: 1, intelligence: 1 } }
  ]
};

// Préfixes pour la génération de noms
const ITEM_PREFIXES = {
  common: ['Usé', 'Simple', 'Ordinaire', 'Basique'],
  uncommon: ['Renforcé', 'Solide', 'Robuste', 'Amélioré'],
  rare: ['Maître', 'Expert', 'Excellent', 'Raffiné'],
  epic: ['Glorieux', 'Légendaire', 'Héroïque', 'Mythique'],
  legendary: ['Ancien', 'Éternel', 'Divin', 'Sacré'],
  mythic: ['Céleste', 'Primordial', 'Absolu', 'Transcendant']
};

// Suffixes pour la génération de noms
const ITEM_SUFFIXES = {
  strength: ['du Titan', 'de Force', 'du Guerrier', 'de Puissance'],
  agility: ['du Vent', 'de l\'Ombre', 'du Lynx', 'de Vitesse'],
  intelligence: ['du Sage', 'de Sagesse', 'de l\'Érudit', 'du Mage'],
  endurance: ['du Colosse', 'de Résistance', 'du Gardien', 'de Vigueur'],
  luck: ['de Fortune', 'du Destin', 'de Chance', 'de l\'Étoile']
};

// Export pour utilisation globale
window.RARITIES = RARITIES;
window.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;
window.ITEM_TEMPLATES = ITEM_TEMPLATES;
window.ITEM_PREFIXES = ITEM_PREFIXES;
window.ITEM_SUFFIXES = ITEM_SUFFIXES;
