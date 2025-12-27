/* ==============================================
   ELANIA RPG - Fonctions Utilitaires
   ============================================== */

const Helpers = {
  /**
   * Génère un ID unique
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Génère un nombre aléatoire entre min et max (inclus)
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Génère un nombre flottant aléatoire entre min et max
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Sélectionne un élément aléatoire dans un tableau
   * @param {Array} array
   * @returns {any}
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Sélectionne un élément basé sur des poids
   * @param {Array} items - Tableau d'objets avec une propriété 'weight'
   * @returns {any}
   */
  weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= (item.weight || 1);
      if (random <= 0) {
        return item;
      }
    }
    return items[items.length - 1];
  },

  /**
   * Formate un nombre avec des séparateurs de milliers
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  /**
   * Formate un temps en secondes en MM:SS ou HH:MM:SS
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Calcule l'XP nécessaire pour un niveau donné (courbe exponentielle)
   * @param {number} level
   * @returns {number}
   */
  xpForLevel(level) {
    // Formule: 100 * niveau² (ajustable)
    return Math.floor(100 * Math.pow(level, 2));
  },

  /**
   * Calcule le niveau à partir de l'XP total
   * @param {number} totalXp
   * @returns {number}
   */
  levelFromXp(totalXp) {
    let level = 1;
    let xpNeeded = this.xpForLevel(level);

    while (totalXp >= xpNeeded && level < 100) {
      totalXp -= xpNeeded;
      level++;
      xpNeeded = this.xpForLevel(level);
    }

    return level;
  },

  /**
   * Vérifie si un pourcentage est atteint (pour les chances)
   * @param {number} percentage - Pourcentage de chance (0-100)
   * @returns {boolean}
   */
  checkChance(percentage) {
    return Math.random() * 100 < percentage;
  },

  /**
   * Clone profondément un objet
   * @param {Object} obj
   * @returns {Object}
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Limite une valeur entre min et max
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Mélange un tableau (Fisher-Yates)
   * @param {Array} array
   * @returns {Array}
   */
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * Attend un certain temps (pour les animations)
   * @param {number} ms - Millisecondes à attendre
   * @returns {Promise}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Capitalise la première lettre
   * @param {string} str
   * @returns {string}
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Génère un nom aléatoire pour les adversaires
   * @returns {string}
   */
  generateRandomName() {
    const prefixes = ['Sombre', 'Valeureux', 'Féroce', 'Noble', 'Rusé', 'Brave', 'Ancien', 'Mystique'];
    const names = ['Aldric', 'Bran', 'Cedric', 'Dorian', 'Elric', 'Fenris', 'Gareth', 'Hadrian',
                   'Isolde', 'Jorah', 'Kaelen', 'Lyra', 'Magnus', 'Nera', 'Orin', 'Petra',
                   'Quinn', 'Rowan', 'Seren', 'Theron', 'Una', 'Varen', 'Wren', 'Xander', 'Yara', 'Zephyr'];

    // 50% de chance d'avoir un préfixe
    if (Math.random() > 0.5) {
      return `${this.randomElement(prefixes)} ${this.randomElement(names)}`;
    }
    return this.randomElement(names);
  }
};

// Export pour utilisation globale
window.Helpers = Helpers;
