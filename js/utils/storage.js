/* ==============================================
   ELANIA RPG - Gestion du localStorage
   ============================================== */

const Storage = {
  // Clés de stockage
  KEYS: {
    CHARACTER: 'elania_character',
    INVENTORY: 'elania_inventory',
    EQUIPMENT: 'elania_equipment',
    EXPEDITION: 'elania_expedition',
    ARENA: 'elania_arena',
    SETTINGS: 'elania_settings'
  },

  /**
   * Sauvegarde une donnée dans le localStorage
   * @param {string} key - Clé de stockage
   * @param {any} data - Données à sauvegarder
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      return false;
    }
  },

  /**
   * Charge une donnée depuis le localStorage
   * @param {string} key - Clé de stockage
   * @param {any} defaultValue - Valeur par défaut si rien n'existe
   * @returns {any} Les données chargées ou la valeur par défaut
   */
  load(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return defaultValue;
      }
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      return defaultValue;
    }
  },

  /**
   * Supprime une donnée du localStorage
   * @param {string} key - Clé à supprimer
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur de suppression:', error);
      return false;
    }
  },

  /**
   * Vérifie si une clé existe
   * @param {string} key - Clé à vérifier
   * @returns {boolean}
   */
  exists(key) {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Efface toutes les données du jeu
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Méthodes spécifiques pour le personnage
  saveCharacter(character) {
    return this.save(this.KEYS.CHARACTER, character);
  },

  loadCharacter() {
    return this.load(this.KEYS.CHARACTER, null);
  },

  hasCharacter() {
    return this.exists(this.KEYS.CHARACTER);
  },

  // Méthodes pour l'inventaire
  saveInventory(inventory) {
    return this.save(this.KEYS.INVENTORY, inventory);
  },

  loadInventory() {
    return this.load(this.KEYS.INVENTORY, []);
  },

  // Méthodes pour l'équipement
  saveEquipment(equipment) {
    return this.save(this.KEYS.EQUIPMENT, equipment);
  },

  loadEquipment() {
    return this.load(this.KEYS.EQUIPMENT, {});
  },

  // Méthodes pour l'expédition
  saveExpedition(expedition) {
    return this.save(this.KEYS.EXPEDITION, expedition);
  },

  loadExpedition() {
    return this.load(this.KEYS.EXPEDITION, null);
  },

  // Méthodes pour l'arène
  saveArena(arena) {
    return this.save(this.KEYS.ARENA, arena);
  },

  loadArena() {
    return this.load(this.KEYS.ARENA, {
      points: 0,
      fightsToday: 10,
      lastReset: new Date().toDateString(),
      opponents: []
    });
  }
};

// Export pour utilisation globale
window.Storage = Storage;
