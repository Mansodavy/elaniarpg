/* ==============================================
   ELANIA RPG - Gestion des Modals
   ============================================== */

/**
 * Ouvre une modal
 * @param {string} modalId - ID de la modal
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Ferme une modal
 * @param {string} modalId - ID de la modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Ferme toutes les modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = '';
}

/**
 * Affiche la modal d'item (tooltip/actions)
 * @param {Object} item - L'item à afficher
 * @param {Object} options - Options d'affichage
 */
function showItemModal(item, options = {}) {
  const modal = document.getElementById('item-modal');
  const rarity = RARITIES[item.rarity];

  // Titre
  document.getElementById('item-modal-title').textContent = item.name;
  document.getElementById('item-modal-title').style.color = rarity.color;

  // Corps
  const body = document.getElementById('item-modal-body');

  let statsHtml = formatItemStats(item).map(stat => `<div class="stat-row"><span>${stat}</span></div>`).join('');

  body.innerHTML = `
    <div class="item-modal-icon" style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">
      ${item.icon}
    </div>
    <div class="item-modal-rarity" style="text-align: center; color: ${rarity.color}; margin-bottom: 1rem;">
      ${rarity.name}
    </div>
    <div class="item-modal-level" style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">
      Niveau requis: ${item.levelRequired || 1}
    </div>
    <div class="item-modal-stats">
      ${statsHtml}
    </div>
    ${item.setId ? `
      <div class="item-modal-set" style="margin-top: 1rem; color: var(--rarity-uncommon);">
        Set: ${EQUIPMENT_SETS[item.setId]?.name || 'Inconnu'}
      </div>
    ` : ''}
  `;

  // Actions
  const footer = document.getElementById('item-modal-footer');
  let actionsHtml = '';

  if (options.showEquip) {
    actionsHtml += `<button class="btn btn-primary" onclick="handleEquipItem('${item.instanceId}')">Équiper</button>`;
  }

  if (options.showUnequip) {
    actionsHtml += `<button class="btn btn-secondary" onclick="handleUnequipItem('${options.slot}')">Déséquiper</button>`;
  }

  if (options.showSell) {
    const sellPrice = calculateSellPrice(item);
    actionsHtml += `<button class="btn btn-danger" onclick="handleSellItem('${item.instanceId}')">Vendre (${sellPrice} or)</button>`;
  }

  actionsHtml += `<button class="btn btn-secondary" onclick="closeModal('item-modal')">Fermer</button>`;

  footer.innerHTML = actionsHtml;

  openModal('item-modal');
}

/**
 * Affiche la modal de combat
 * @param {Object} playerCombatant - Combattant joueur
 * @param {Object} enemyCombatant - Combattant ennemi
 * @param {Object} combatResult - Résultat du combat (null pour combat interactif)
 * @param {boolean} interactive - Mode interactif
 */
function showCombatModal(playerCombatant, enemyCombatant, combatResult, interactive = false) {
  const modal = document.getElementById('combat-modal');

  // Infos des combattants
  document.getElementById('combat-player-name').textContent = playerCombatant.name;
  document.getElementById('combat-player-level').textContent = `Niv. ${playerCombatant.level}`;
  document.getElementById('combat-enemy-name').textContent = enemyCombatant.name;
  document.getElementById('combat-enemy-level').textContent = `Niv. ${enemyCombatant.level}`;
  document.getElementById('combat-enemy-icon').textContent = enemyCombatant.icon;

  // Reset des barres de vie
  document.getElementById('combat-player-hp-fill').style.width = '100%';
  document.getElementById('combat-enemy-hp-fill').style.width = '100%';
  document.getElementById('combat-player-hp-text').textContent = `${playerCombatant.maxHp}/${playerCombatant.maxHp}`;
  document.getElementById('combat-enemy-hp-text').textContent = `${enemyCombatant.maxHp}/${enemyCombatant.maxHp}`;

  // Vider le log
  document.getElementById('combat-log').innerHTML = '';

  // Cacher le résultat
  document.getElementById('combat-result').style.display = 'none';
  document.getElementById('combat-actions').style.display = 'flex';

  openModal('combat-modal');

  if (interactive) {
    // Mode combat interactif
    window.isInteractiveCombat = true;
    initInteractiveCombat(playerCombatant, enemyCombatant);
    renderCombatUI();
  } else {
    // Mode animation (combat déjà résolu)
    window.isInteractiveCombat = false;
    window.currentCombat = {
      player: playerCombatant,
      enemy: enemyCombatant,
      result: combatResult,
      animationIndex: 0
    };

    // Lancer l'animation automatiquement après un court délai
    setTimeout(() => {
      animateCombat();
    }, 500);
  }
}

/**
 * Affiche l'interface de combat interactif
 */
function renderCombatUI() {
  const combat = getCurrentCombatState();
  if (!combat) return;

  const actionsDiv = document.getElementById('combat-actions');

  // Mettre à jour les barres de vie
  updateCombatBars(combat);

  // Afficher le log
  renderCombatLog(combat.log);

  // Si le combat est fini
  if (combat.isFinished) {
    showCombatResult({
      victory: combat.victory,
      playerHpRemaining: combat.player.currentHp,
      enemyHpRemaining: combat.enemy.currentHp,
      rewards: combat.options.rewards
    });
    return;
  }

  // Si c'est le tour de l'ennemi, exécuter automatiquement
  if (combat.phase === 'enemy') {
    actionsDiv.innerHTML = `<div class="enemy-turn-indicator">Tour de l'ennemi...</div>`;
    setTimeout(() => {
      const prevPlayerHp = combat.player.currentHp;
      const result = executeEnemyTurn();

      // Animer l'attaque ennemie
      if (result.success && result.continuesCombat) {
        playCombatAnimation('enemy', 'attack');
        setTimeout(() => {
          const damage = prevPlayerHp - getCurrentCombatState().player.currentHp;
          if (damage > 0) {
            playCombatAnimation('player', 'hit');
            showDamageNumber('player', damage, result.enemyAttack?.isCritical);
          } else {
            showDamageNumber('player', 'Esquive!', false, 'miss');
          }
          renderCombatUI();
        }, 200);
      } else {
        renderCombatUI();
      }
    }, 600);
    return;
  }

  // Afficher les compétences du joueur
  renderSkillButtons(combat.player.skillState);
}

/**
 * Met à jour les barres de vie
 * @param {Object} combat - État du combat
 */
function updateCombatBars(combat) {
  const playerPercent = (combat.player.currentHp / combat.player.maxHp) * 100;
  const enemyPercent = (combat.enemy.currentHp / combat.enemy.maxHp) * 100;

  const playerHpBar = document.getElementById('combat-player-hp-fill');
  const enemyHpBar = document.getElementById('combat-enemy-hp-fill');
  const playerHealth = playerHpBar.parentElement;
  const enemyHealth = enemyHpBar.parentElement;

  playerHpBar.style.width = `${playerPercent}%`;
  document.getElementById('combat-player-hp-text').textContent = `${combat.player.currentHp}/${combat.player.maxHp}`;

  enemyHpBar.style.width = `${enemyPercent}%`;
  document.getElementById('combat-enemy-hp-text').textContent = `${combat.enemy.currentHp}/${combat.enemy.maxHp}`;

  // Ajouter effet de pulsation si HP bas
  if (playerPercent <= 25) {
    playerHealth.classList.add('low');
  } else {
    playerHealth.classList.remove('low');
  }

  if (enemyPercent <= 25) {
    enemyHealth.classList.add('low');
  } else {
    enemyHealth.classList.remove('low');
  }
}

/**
 * Affiche le log de combat
 * @param {Array} log - Entrées du log
 */
function renderCombatLog(log) {
  const logElement = document.getElementById('combat-log');

  // Ne garder que les dernières entrées
  const recentLog = log.slice(-10);

  logElement.innerHTML = recentLog.map(entry => {
    let className = 'combat-log-entry';

    if (entry.type.includes('player')) {
      className += ' player-action';
    } else if (entry.type.includes('enemy')) {
      className += ' enemy-action';
    }

    if (entry.isCritical) {
      className += ' critical';
    }

    if (entry.type.includes('dodge')) {
      className += ' dodge';
    }

    if (entry.type === 'turn') {
      className += ' turn-marker';
    }

    return `<div class="${className}">${entry.message}</div>`;
  }).join('');

  logElement.scrollTop = logElement.scrollHeight;
}

/**
 * Affiche les boutons de compétences
 * @param {Object} skillState - État des compétences
 */
function renderSkillButtons(skillState) {
  const actionsDiv = document.getElementById('combat-actions');

  // Afficher la barre de mana
  let html = `
    <div class="combat-mana-bar">
      <div class="mana-label">Mana: ${skillState.mana}/${skillState.maxMana}</div>
      <div class="mana-progress">
        <div class="mana-fill" style="width: ${(skillState.mana / skillState.maxMana) * 100}%"></div>
      </div>
    </div>
    <div class="skill-buttons">
  `;

  skillState.skills.forEach(skill => {
    const check = canUseSkill(skillState, skill.id);
    const disabled = !check.canUse;
    const disabledClass = disabled ? 'disabled' : '';

    let cooldownText = '';
    if (skill.currentCooldown > 0) {
      cooldownText = `<span class="skill-cooldown">${skill.currentCooldown}</span>`;
    }

    let usesText = '';
    if (skill.maxUses) {
      usesText = `<span class="skill-uses">${skill.usesRemaining}/${skill.maxUses}</span>`;
    }

    html += `
      <button class="skill-btn ${disabledClass}"
              onclick="handleSkillClick('${skill.id}')"
              ${disabled ? 'disabled' : ''}
              title="${skill.description}${skill.manaCost > 0 ? ' (Coût: ' + skill.manaCost + ' mana)' : ''}">
        <span class="skill-icon">${skill.icon}</span>
        <span class="skill-name">${skill.name}</span>
        ${cooldownText}
        ${usesText}
      </button>
    `;
  });

  html += '</div>';

  // Ajouter les effets actifs
  if (skillState.activeEffects.length > 0) {
    html += '<div class="active-effects">';
    skillState.activeEffects.forEach(effect => {
      let effectIcon = '';
      let effectName = '';

      switch (effect.type) {
        case 'damageReduction':
          effectIcon = '🛡️';
          effectName = `Défense (${effect.remainingDuration})`;
          break;
        case 'damageBoost':
          effectIcon = '💪';
          effectName = `Rage (${effect.remainingDuration})`;
          break;
      }

      html += `<div class="effect-badge">${effectIcon} ${effectName}</div>`;
    });
    html += '</div>';
  }

  actionsDiv.innerHTML = html;
}

/**
 * Gère le clic sur une compétence
 * @param {string} skillId - ID de la compétence
 */
function handleSkillClick(skillId) {
  const combat = getCurrentCombatState();
  const prevEnemyHp = combat.enemy.currentHp;
  const prevPlayerHp = combat.player.currentHp;

  const result = executePlayerAction(skillId);

  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  // Animer selon le type de compétence
  const skill = result.playerAction?.skill;

  if (skill) {
    if (skill.type === 'damage' || skill.type === 'magic') {
      // Animation d'attaque
      playCombatAnimation('player', 'attack');
      setTimeout(() => {
        const damage = prevEnemyHp - getCurrentCombatState().enemy.currentHp;
        if (damage > 0) {
          playCombatAnimation('enemy', 'hit');
          showDamageNumber('enemy', damage, result.playerAction.damage >= prevEnemyHp * 0.3);
          if (skill.type === 'magic') {
            showSpellEffect('enemy', skill.id);
          }
        }
        updateCombatBars(getCurrentCombatState());
        renderCombatLog(getCurrentCombatState().log);
        continueAfterPlayerAction();
      }, 250);
      return;
    } else if (skill.type === 'heal' || skill.type === 'consumable') {
      // Animation de soin
      playCombatAnimation('player', 'heal');
      const healing = getCurrentCombatState().player.currentHp - prevPlayerHp;
      showDamageNumber('player', `+${healing}`, false, 'heal');
      showHealParticles('player');
    } else if (skill.type === 'buff') {
      // Animation de buff
      playCombatAnimation('player', 'buff');
    }
  }

  updateCombatBars(getCurrentCombatState());
  renderCombatLog(getCurrentCombatState().log);
  continueAfterPlayerAction();
}

/**
 * Continue après l'action du joueur
 */
function continueAfterPlayerAction() {
  const combat = getCurrentCombatState();

  if (combat.isFinished) {
    showCombatResult({
      victory: combat.victory,
      playerHpRemaining: combat.player.currentHp,
      enemyHpRemaining: combat.enemy.currentHp,
      rewards: combat.options?.rewards
    });
    return;
  }

  // Passer au tour ennemi après un court délai
  setTimeout(() => {
    renderCombatUI();
  }, 400);
}

/**
 * Joue une animation de combat
 * @param {string} target - 'player' ou 'enemy'
 * @param {string} animType - Type d'animation
 */
function playCombatAnimation(target, animType) {
  const combatant = document.querySelector(`.combatant.${target}`);
  if (!combatant) return;

  const avatar = combatant.querySelector('.combatant-avatar');
  if (!avatar) return;

  // Retirer toutes les classes d'animation
  avatar.classList.remove('anim-attack', 'anim-hit', 'anim-heal', 'anim-buff');

  // Force reflow
  void avatar.offsetWidth;

  // Ajouter la classe d'animation
  const animClass = `anim-${animType}`;
  avatar.classList.add(animClass);

  // Retirer après l'animation
  setTimeout(() => {
    avatar.classList.remove(animClass);
  }, 600);
}

/**
 * Affiche un nombre de dégâts flottant
 * @param {string} target - 'player' ou 'enemy'
 * @param {number|string} value - Valeur à afficher
 * @param {boolean} isCritical - Si c'est un critique
 * @param {string} type - Type (damage, heal, miss, block)
 */
function showDamageNumber(target, value, isCritical = false, type = 'damage') {
  const combatant = document.querySelector(`.combatant.${target}`);
  if (!combatant) return;

  const avatar = combatant.querySelector('.combatant-avatar');
  if (!avatar) return;

  const dmgNum = document.createElement('div');
  dmgNum.className = `damage-number ${type} ${isCritical ? 'critical' : ''}`;
  dmgNum.textContent = isCritical ? `${value}!` : value;

  // Positionner au centre de l'avatar
  dmgNum.style.position = 'absolute';
  dmgNum.style.left = '50%';
  dmgNum.style.top = '20%';
  dmgNum.style.transform = 'translateX(-50%)';
  dmgNum.style.zIndex = '100';

  combatant.style.position = 'relative';
  combatant.appendChild(dmgNum);

  // Supprimer après l'animation
  setTimeout(() => {
    if (dmgNum.parentNode) {
      dmgNum.remove();
    }
  }, 900);
}

/**
 * Affiche un effet de sort
 * @param {string} target - 'player' ou 'enemy'
 * @param {string} spellId - ID du sort
 */
function showSpellEffect(target, spellId) {
  const combatant = document.querySelector(`.combatant.${target}`);
  if (!combatant) return;

  const avatar = combatant.querySelector('.combatant-avatar');

  let emoji = '';
  switch (spellId) {
    case 'fireball': emoji = '🔥'; break;
    case 'iceSpear': emoji = '❄️'; break;
    default: emoji = '✨';
  }

  // Créer plusieurs particules
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'heal-particle';
    particle.textContent = emoji;
    particle.style.left = `${50 + (Math.random() - 0.5) * 60}%`;
    particle.style.top = `${30 + Math.random() * 40}%`;
    particle.style.animationDelay = `${i * 0.1}s`;

    combatant.style.position = 'relative';
    combatant.appendChild(particle);

    setTimeout(() => particle.remove(), 800);
  }
}

/**
 * Affiche des particules de soin
 * @param {string} target - 'player' ou 'enemy'
 */
function showHealParticles(target) {
  const combatant = document.querySelector(`.combatant.${target}`);
  if (!combatant) return;

  const emojis = ['💚', '✨', '💫', '+'];

  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.className = 'heal-particle';
    particle.textContent = emojis[i % emojis.length];
    particle.style.left = `${30 + Math.random() * 40}%`;
    particle.style.top = `${40 + Math.random() * 30}%`;
    particle.style.animationDelay = `${i * 0.08}s`;

    combatant.style.position = 'relative';
    combatant.appendChild(particle);

    setTimeout(() => particle.remove(), 800);
  }
}

/**
 * Anime le combat tour par tour
 */
async function animateCombat() {
  const combat = window.currentCombat;
  if (!combat) return;

  const actions = prepareCombatAnimation(combat.result);
  const logElement = document.getElementById('combat-log');
  const playerHpFill = document.getElementById('combat-player-hp-fill');
  const playerHpText = document.getElementById('combat-player-hp-text');
  const enemyHpFill = document.getElementById('combat-enemy-hp-fill');
  const enemyHpText = document.getElementById('combat-enemy-hp-text');

  let playerHp = combat.player.maxHp;
  let enemyHp = combat.enemy.maxHp;

  document.getElementById('combat-actions').innerHTML = `
    <button class="btn btn-secondary" onclick="skipCombatAnimation()">Passer</button>
  `;

  for (const action of actions) {
    if (window.skipCombat) {
      break;
    }

    // Ajouter au log
    const logEntry = document.createElement('div');
    logEntry.className = `combat-log-entry ${action.isPlayer ? 'player-action' : 'enemy-action'}`;

    if (action.isCritical) {
      logEntry.classList.add('critical');
    }
    if (action.type === 'dodge') {
      logEntry.classList.add('dodge');
    }

    logEntry.textContent = action.message;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;

    // Mettre à jour les barres de vie
    if (action.type === 'attack') {
      if (action.isPlayer) {
        enemyHp = action.targetHp;
        const percent = (enemyHp / combat.enemy.maxHp) * 100;
        enemyHpFill.style.width = `${percent}%`;
        enemyHpText.textContent = `${enemyHp}/${combat.enemy.maxHp}`;
      } else {
        playerHp = action.targetHp;
        const percent = (playerHp / combat.player.maxHp) * 100;
        playerHpFill.style.width = `${percent}%`;
        playerHpText.textContent = `${playerHp}/${combat.player.maxHp}`;
      }
    }

    await Helpers.wait(action.delay || 500);
  }

  // Afficher le résultat
  showCombatResult(combat.result);
}

/**
 * Passe l'animation de combat
 */
function skipCombatAnimation() {
  window.skipCombat = true;
  const combat = window.currentCombat;

  if (combat) {
    // Mettre à jour les barres de vie finales
    const playerPercent = (combat.result.playerHpRemaining / combat.player.maxHp) * 100;
    const enemyPercent = (combat.result.enemyHpRemaining / combat.enemy.maxHp) * 100;

    document.getElementById('combat-player-hp-fill').style.width = `${playerPercent}%`;
    document.getElementById('combat-player-hp-text').textContent = `${combat.result.playerHpRemaining}/${combat.player.maxHp}`;
    document.getElementById('combat-enemy-hp-fill').style.width = `${enemyPercent}%`;
    document.getElementById('combat-enemy-hp-text').textContent = `${combat.result.enemyHpRemaining}/${combat.enemy.maxHp}`;

    showCombatResult(combat.result);
  }
}

/**
 * Affiche le résultat du combat
 * @param {Object} result - Résultat du combat
 */
function showCombatResult(result) {
  const resultElement = document.getElementById('combat-result');
  resultElement.style.display = 'block';
  resultElement.className = `combat-result ${result.victory ? 'victory' : 'defeat'}`;

  let html = `<h3>${result.victory ? 'Victoire !' : 'Défaite...'}</h3>`;

  if (result.rewards) {
    html += '<div class="combat-rewards">';
    if (result.rewards.xp) {
      html += `<div class="reward-item"><span>📈</span><span>+${result.rewards.xp} XP</span></div>`;
    }
    if (result.rewards.gold) {
      html += `<div class="reward-item"><span>💰</span><span>+${result.rewards.gold} Or</span></div>`;
    }
    html += '</div>';

    if (result.rewards.loot && result.rewards.loot.length > 0) {
      html += '<div class="combat-loot mt-2">';
      result.rewards.loot.forEach(item => {
        html += `<div class="reward-item" style="border-color: ${RARITIES[item.rarity].color}">
          <span>${item.icon}</span>
          <span class="rarity-${item.rarity}">${item.name}</span>
        </div>`;
      });
      html += '</div>';
    }
  }

  resultElement.innerHTML = html;

  // Stocker le résultat pour la fermeture
  window.combatFinalResult = result;

  document.getElementById('combat-actions').innerHTML = `
    <button class="btn btn-primary" onclick="closeCombatModal()">Continuer</button>
  `;

  window.skipCombat = false;
}

/**
 * Ferme la modal de combat et rafraîchit
 */
function closeCombatModal() {
  closeModal('combat-modal');

  // Si c'était un combat interactif, traiter les récompenses
  if (window.isInteractiveCombat && window.combatFinalResult) {
    onInteractiveCombatEnd(window.combatFinalResult);
    window.combatFinalResult = null;
  }

  window.currentCombat = null;
  window.isInteractiveCombat = false;

  // Rafraîchir l'écran actuel
  refreshScreen(currentScreen);
  updateGoldDisplay();
}

/**
 * Affiche la modal de confirmation
 * @param {string} title - Titre
 * @param {string} message - Message
 * @param {Function} onConfirm - Callback de confirmation
 */
function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;

  window.confirmCallback = onConfirm;

  openModal('confirm-modal');
}

/**
 * Confirme l'action
 */
function confirmAction() {
  if (window.confirmCallback) {
    window.confirmCallback();
    window.confirmCallback = null;
  }
  closeModal('confirm-modal');
}

/**
 * Annule l'action
 */
function cancelAction() {
  window.confirmCallback = null;
  closeModal('confirm-modal');
}

// Export pour utilisation globale
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.showItemModal = showItemModal;
window.showCombatModal = showCombatModal;
window.animateCombat = animateCombat;
window.skipCombatAnimation = skipCombatAnimation;
window.showCombatResult = showCombatResult;
window.closeCombatModal = closeCombatModal;
window.showConfirmModal = showConfirmModal;
window.confirmAction = confirmAction;
window.cancelAction = cancelAction;
window.renderCombatUI = renderCombatUI;
window.handleSkillClick = handleSkillClick;
window.playCombatAnimation = playCombatAnimation;
window.showDamageNumber = showDamageNumber;
window.showSpellEffect = showSpellEffect;
window.showHealParticles = showHealParticles;
