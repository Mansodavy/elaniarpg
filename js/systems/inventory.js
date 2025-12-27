/* ==============================================
   ELANIA RPG - Système d'Inventaire et Équipement
   ============================================== */

const INVENTORY_SIZE = 20; // Nombre de slots dans l'inventaire

/**
 * Récupère l'inventaire
 * @returns {Array} Items dans l'inventaire
 */
function getInventory() {
  return Storage.loadInventory();
}

/**
 * Récupère l'équipement
 * @returns {Object} Équipement par slot
 */
function getEquipment() {
  return Storage.loadEquipment();
}

/**
 * Ajoute un item à l'inventaire
 * @param {Object} item - L'item à ajouter
 * @returns {boolean} True si ajouté, false si inventaire plein
 */
function addToInventory(item) {
  const inventory = getInventory();

  if (inventory.length >= INVENTORY_SIZE) {
    return false; // Inventaire plein
  }

  // Générer un ID unique pour l'item
  item.instanceId = Helpers.generateId();
  inventory.push(item);
  Storage.saveInventory(inventory);

  return true;
}

/**
 * Retire un item de l'inventaire
 * @param {string} instanceId - ID de l'instance de l'item
 * @returns {Object|null} L'item retiré ou null
 */
function removeFromInventory(instanceId) {
  const inventory = getInventory();
  const index = inventory.findIndex(item => item.instanceId === instanceId);

  if (index === -1) {
    return null;
  }

  const [item] = inventory.splice(index, 1);
  Storage.saveInventory(inventory);

  return item;
}

/**
 * Équipe un item depuis l'inventaire
 * @param {string} instanceId - ID de l'instance de l'item à équiper
 * @returns {Object} Résultat de l'opération
 */
function equipItem(instanceId) {
  const inventory = getInventory();
  const itemIndex = inventory.findIndex(item => item.instanceId === instanceId);

  if (itemIndex === -1) {
    return { success: false, message: 'Item non trouvé' };
  }

  const item = inventory[itemIndex];
  const slot = item.slot;

  if (!EQUIPMENT_SLOTS[slot]) {
    return { success: false, message: 'Slot invalide' };
  }

  // Vérifier le niveau requis
  const character = loadCharacter();
  if (item.levelRequired && character.level < item.levelRequired) {
    return { success: false, message: `Niveau ${item.levelRequired} requis` };
  }

  const equipment = getEquipment();

  // Si un item est déjà équipé, le remettre dans l'inventaire
  let unequippedItem = null;
  if (equipment[slot]) {
    unequippedItem = equipment[slot];
  }

  // Équiper le nouvel item
  equipment[slot] = item;
  inventory.splice(itemIndex, 1);

  // Remettre l'ancien item dans l'inventaire
  if (unequippedItem) {
    inventory.push(unequippedItem);
  }

  // Sauvegarder
  Storage.saveEquipment(equipment);
  Storage.saveInventory(inventory);

  // Mettre à jour les stats du personnage
  updateDerivedStats(character);

  return {
    success: true,
    message: `${item.name} équipé`,
    unequippedItem
  };
}

/**
 * Déséquipe un item
 * @param {string} slot - Slot à déséquiper
 * @returns {Object} Résultat de l'opération
 */
function unequipItem(slot) {
  const equipment = getEquipment();

  if (!equipment[slot]) {
    return { success: false, message: 'Aucun item équipé' };
  }

  const inventory = getInventory();

  if (inventory.length >= INVENTORY_SIZE) {
    return { success: false, message: 'Inventaire plein' };
  }

  const item = equipment[slot];
  delete equipment[slot];
  inventory.push(item);

  // Sauvegarder
  Storage.saveEquipment(equipment);
  Storage.saveInventory(inventory);

  // Mettre à jour les stats du personnage
  const character = loadCharacter();
  updateDerivedStats(character);

  return {
    success: true,
    message: `${item.name} déséquipé`,
    item
  };
}

/**
 * Vend un item de l'inventaire
 * @param {string} instanceId - ID de l'instance de l'item
 * @returns {Object} Résultat de la vente
 */
function sellItem(instanceId) {
  const inventory = getInventory();
  const itemIndex = inventory.findIndex(item => item.instanceId === instanceId);

  if (itemIndex === -1) {
    return { success: false, message: 'Item non trouvé' };
  }

  const item = inventory[itemIndex];
  const sellPrice = calculateSellPrice(item);

  inventory.splice(itemIndex, 1);
  Storage.saveInventory(inventory);

  // Ajouter l'or
  const character = loadCharacter();
  addGold(character, sellPrice);

  return {
    success: true,
    message: `${item.name} vendu pour ${sellPrice} or`,
    gold: sellPrice
  };
}

/**
 * Calcule le prix de vente d'un item
 * @param {Object} item - L'item
 * @returns {number} Prix de vente
 */
function calculateSellPrice(item) {
  const rarityMultipliers = {
    common: 1,
    uncommon: 2,
    rare: 5,
    epic: 15,
    legendary: 50,
    mythic: 200
  };

  const basePrice = 5;
  const levelMultiplier = item.levelRequired || 1;
  const rarityMultiplier = rarityMultipliers[item.rarity] || 1;

  return Math.floor(basePrice * levelMultiplier * rarityMultiplier);
}

/**
 * Récupère les items d'un type spécifique dans l'inventaire
 * @param {string} slot - Type de slot à filtrer
 * @returns {Array} Items filtrés
 */
function getInventoryBySlot(slot) {
  const inventory = getInventory();
  return inventory.filter(item => item.slot === slot);
}

/**
 * Récupère les items d'une rareté spécifique dans l'inventaire
 * @param {string} rarity - Rareté à filtrer
 * @returns {Array} Items filtrés
 */
function getInventoryByRarity(rarity) {
  const inventory = getInventory();
  return inventory.filter(item => item.rarity === rarity);
}

/**
 * Trie l'inventaire
 * @param {string} sortBy - Critère de tri (rarity, level, slot, name)
 * @param {boolean} ascending - Ordre ascendant
 */
function sortInventory(sortBy = 'rarity', ascending = false) {
  const inventory = getInventory();

  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

  inventory.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'rarity':
        comparison = rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        break;
      case 'level':
        comparison = (b.levelRequired || 0) - (a.levelRequired || 0);
        break;
      case 'slot':
        comparison = a.slot.localeCompare(b.slot);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return ascending ? -comparison : comparison;
  });

  Storage.saveInventory(inventory);
}

/**
 * Calcule la valeur totale de l'inventaire
 * @returns {number} Valeur en or
 */
function calculateInventoryValue() {
  const inventory = getInventory();
  return inventory.reduce((total, item) => total + calculateSellPrice(item), 0);
}

// Export pour utilisation globale
window.INVENTORY_SIZE = INVENTORY_SIZE;
window.getInventory = getInventory;
window.getEquipment = getEquipment;
window.addToInventory = addToInventory;
window.removeFromInventory = removeFromInventory;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.sellItem = sellItem;
window.calculateSellPrice = calculateSellPrice;
window.getInventoryBySlot = getInventoryBySlot;
window.getInventoryByRarity = getInventoryByRarity;
window.sortInventory = sortInventory;
window.calculateInventoryValue = calculateInventoryValue;
