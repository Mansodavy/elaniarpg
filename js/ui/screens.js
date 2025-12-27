/* ==============================================
   ELANIA RPG - Gestion des Écrans
   ============================================== */

// Écran actif
let currentScreen = 'character';

/**
 * Change l'écran actif
 * @param {string} screenId - ID de l'écran à afficher
 */
function switchScreen(screenId) {
  // Désactiver tous les écrans
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Désactiver tous les boutons de navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activer l'écran sélectionné
  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
    currentScreen = screenId;

    // Actualiser le contenu de l'écran
    refreshScreen(screenId);
  }

  // Activer le bouton de navigation correspondant
  const navBtn = document.querySelector(`[data-screen="${screenId}"]`);
  if (navBtn) {
    navBtn.classList.add('active');
  }
}

/**
 * Rafraîchit le contenu d'un écran
 * @param {string} screenId - ID de l'écran
 */
function refreshScreen(screenId) {
  switch (screenId) {
    case 'character':
      renderCharacterScreen();
      break;
    case 'map':
      renderMapScreen();
      break;
    case 'arena':
      renderArenaScreen();
      break;
    case 'inventory':
      renderInventoryScreen();
      break;
  }
}

/**
 * Rend l'écran personnage
 */
function renderCharacterScreen() {
  const character = loadCharacter();
  if (!character) return;

  // Mettre à jour les stats dérivées
  const equipmentStats = getEquipmentStats();
  character.derivedStats = calculateDerivedStats(character.baseStats, equipmentStats);

  // Nom et niveau
  document.getElementById('char-name').textContent = character.name;
  document.getElementById('char-level').textContent = `Niveau ${character.level}`;
  document.getElementById('char-origin').textContent = ORIGINS[character.origin]?.name || 'Inconnu';

  // Barres de ressources
  const hpPercent = (character.currentHp / character.derivedStats.maxHp) * 100;
  document.getElementById('hp-fill').style.width = `${hpPercent}%`;
  document.getElementById('hp-text').textContent = `${character.currentHp} / ${character.derivedStats.maxHp}`;

  const xpPercent = (character.xp / character.xpToNextLevel) * 100;
  document.getElementById('xp-fill').style.width = `${xpPercent}%`;
  document.getElementById('xp-text').textContent = `${character.xp} / ${character.xpToNextLevel}`;

  // Stats de base
  const stats = ['strength', 'agility', 'intelligence', 'endurance', 'luck'];
  const statNames = {
    strength: 'Force',
    agility: 'Agilité',
    intelligence: 'Intelligence',
    endurance: 'Endurance',
    luck: 'Chance'
  };

  stats.forEach(stat => {
    const baseValue = character.baseStats[stat];
    const totalValue = character.derivedStats[stat];
    const bonus = totalValue - baseValue;

    document.getElementById(`stat-${stat}`).textContent = totalValue;
    document.getElementById(`stat-${stat}-base`).textContent = bonus > 0 ? `(${baseValue} +${bonus})` : `(${baseValue})`;
  });

  // Points de stats disponibles
  const statPointsContainer = document.getElementById('stat-points-container');
  if (character.statPoints > 0) {
    statPointsContainer.style.display = 'block';
    document.getElementById('stat-points').textContent = character.statPoints;

    // Activer les boutons d'ajout
    document.querySelectorAll('.stat-add-btn').forEach(btn => {
      btn.disabled = false;
    });
  } else {
    statPointsContainer.style.display = 'none';
    document.querySelectorAll('.stat-add-btn').forEach(btn => {
      btn.disabled = true;
    });
  }

  // Stats dérivées
  document.getElementById('derived-attack').textContent = character.derivedStats.attack;
  document.getElementById('derived-magic').textContent = character.derivedStats.magicAttack;
  document.getElementById('derived-defense').textContent = character.derivedStats.defense;
  document.getElementById('derived-dodge').textContent = `${character.derivedStats.dodge.toFixed(1)}%`;
  document.getElementById('derived-critical').textContent = `${character.derivedStats.critical.toFixed(1)}%`;

  // Équipement
  renderEquipmentSlots();
}

/**
 * Rend les slots d'équipement
 */
function renderEquipmentSlots() {
  const equipment = getEquipment();

  for (const [slotId, slotInfo] of Object.entries(EQUIPMENT_SLOTS)) {
    const slotElement = document.getElementById(`slot-${slotId}`);
    if (!slotElement) continue;

    const item = equipment[slotId];

    if (item) {
      slotElement.classList.add('equipped');
      slotElement.innerHTML = `
        <span class="slot-label">${slotInfo.name}</span>
        <div class="slot-item">
          <span class="inventory-item-icon">${item.icon}</span>
          <span class="slot-item-name rarity-${item.rarity}">${item.name}</span>
        </div>
      `;
      slotElement.dataset.itemId = item.instanceId;
    } else {
      slotElement.classList.remove('equipped');
      slotElement.innerHTML = `
        <span class="slot-label">${slotInfo.name}</span>
        <span class="slot-icon">${slotInfo.icon}</span>
      `;
      delete slotElement.dataset.itemId;
    }
  }
}

/**
 * Rend l'écran carte
 */
function renderMapScreen() {
  const character = loadCharacter();
  const zonesContainer = document.getElementById('zones-list');
  const expedition = getActiveExpedition();

  let html = '';

  for (const zone of Object.values(ZONES)) {
    const isAccessible = isZoneAccessible(zone.id, character.level);
    const isLocked = zone.locked;
    const isActive = expedition && expedition.zoneId === zone.id;

    html += `
      <div class="card zone-card ${isLocked ? 'locked' : ''} ${!isAccessible ? 'inaccessible' : ''}" data-zone="${zone.id}">
        <div class="zone-icon">${zone.icon}</div>
        <div class="zone-info">
          <div class="zone-name">${zone.name}</div>
          <div class="zone-level">Niveau ${zone.levelMin} - ${zone.levelMax}</div>
          <div class="zone-desc">${zone.description}</div>
        </div>
        <div class="zone-actions">
          ${isActive ? `
            <div class="expedition-timer" id="timer-${zone.id}">
              ${formatExpeditionTime(getExpeditionTimeRemaining(expedition))}
            </div>
            ${expedition.completed ? `
              <button class="btn btn-success" onclick="handleExpeditionComplete()">Récupérer</button>
            ` : `
              <button class="btn btn-secondary" disabled>En cours...</button>
            `}
          ` : isLocked ? `
            <span class="text-muted">${zone.unlockMessage}</span>
          ` : isAccessible ? `
            <button class="btn btn-primary" onclick="handleStartExpedition('${zone.id}')" ${expedition ? 'disabled' : ''}>
              Explorer (${Helpers.formatTime(zone.expeditionTime)})
            </button>
          ` : `
            <span class="text-muted">Niveau ${zone.levelMin} requis</span>
          `}
        </div>
      </div>
    `;
  }

  zonesContainer.innerHTML = html;

  // Mettre à jour le timer si une expédition est en cours
  if (expedition && !expedition.completed) {
    startExpeditionTimer();
  }
}

/**
 * Démarre le timer d'expédition
 */
let expeditionTimerInterval = null;

function startExpeditionTimer() {
  if (expeditionTimerInterval) {
    clearInterval(expeditionTimerInterval);
  }

  expeditionTimerInterval = setInterval(() => {
    const expedition = getActiveExpedition();

    if (!expedition) {
      clearInterval(expeditionTimerInterval);
      return;
    }

    const remaining = getExpeditionTimeRemaining(expedition);
    const timerElement = document.getElementById(`timer-${expedition.zoneId}`);

    if (timerElement) {
      timerElement.textContent = formatExpeditionTime(remaining);
    }

    if (remaining <= 0) {
      clearInterval(expeditionTimerInterval);
      // Rafraîchir l'écran pour montrer le bouton "Récupérer"
      if (currentScreen === 'map') {
        renderMapScreen();
      }
      showToast('Expédition terminée !', 'success');
    }
  }, 1000);
}

/**
 * Rend l'écran arène
 */
function renderArenaScreen() {
  const arenaInfo = getArenaInfo();
  const opponents = refreshArenaOpponents();

  // Infos d'arène
  document.getElementById('arena-points').textContent = arenaInfo.points;
  document.getElementById('arena-fights').textContent = `${arenaInfo.fightsRemaining}/${arenaInfo.maxFights}`;

  // Liste des adversaires
  const opponentsList = document.getElementById('opponents-list');
  let html = '';

  opponents.forEach(opponent => {
    html += `
      <div class="card opponent-card" data-opponent="${opponent.id}">
        <div class="opponent-avatar">${opponent.icon}</div>
        <div class="opponent-info">
          <div class="opponent-name">${opponent.name}</div>
          <div class="opponent-level">Niveau ${opponent.level} - ${opponent.arenaPoints} pts</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="handleArenaFight('${opponent.id}')" ${arenaInfo.fightsRemaining <= 0 ? 'disabled' : ''}>
          Combattre
        </button>
      </div>
    `;
  });

  opponentsList.innerHTML = html;
}

/**
 * Rend l'écran inventaire
 */
function renderInventoryScreen() {
  const inventory = getInventory();
  const inventoryGrid = document.getElementById('inventory-grid');

  let html = '';

  // Slots d'inventaire
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const item = inventory[i];

    if (item) {
      html += `
        <div class="inventory-slot rarity-${item.rarity}" data-item-id="${item.instanceId}" onclick="handleInventoryItemClick('${item.instanceId}')">
          <span class="inventory-item-icon">${item.icon}</span>
        </div>
      `;
    } else {
      html += `<div class="inventory-slot empty"></div>`;
    }
  }

  inventoryGrid.innerHTML = html;

  // Compteur d'inventaire
  document.getElementById('inventory-count').textContent = `${inventory.length}/${INVENTORY_SIZE}`;
}

/**
 * Met à jour l'affichage de l'or
 */
function updateGoldDisplay() {
  const character = loadCharacter();
  if (character) {
    document.getElementById('gold-amount').textContent = Helpers.formatNumber(character.gold);
  }
}

// Export pour utilisation globale
window.currentScreen = currentScreen;
window.switchScreen = switchScreen;
window.refreshScreen = refreshScreen;
window.renderCharacterScreen = renderCharacterScreen;
window.renderEquipmentSlots = renderEquipmentSlots;
window.renderMapScreen = renderMapScreen;
window.startExpeditionTimer = startExpeditionTimer;
window.renderArenaScreen = renderArenaScreen;
window.renderInventoryScreen = renderInventoryScreen;
window.updateGoldDisplay = updateGoldDisplay;
