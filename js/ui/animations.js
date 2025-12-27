/* ==============================================
   ELANIA RPG - Animations
   ============================================== */

/**
 * Anime l'apparition d'un élément
 * @param {HTMLElement} element - L'élément à animer
 * @param {string} animation - Type d'animation
 */
function animateElement(element, animation = 'fadeIn') {
  element.style.animation = 'none';
  element.offsetHeight; // Force reflow
  element.style.animation = `${animation} 0.3s ease forwards`;
}

/**
 * Anime les dégâts sur un combattant
 * @param {string} targetId - ID de l'élément cible
 * @param {number} damage - Montant des dégâts
 * @param {boolean} isCritical - Si c'est un critique
 */
function animateDamage(targetId, damage, isCritical = false) {
  const target = document.getElementById(targetId);
  if (!target) return;

  // Créer l'élément de dégâts
  const damageElement = document.createElement('div');
  damageElement.className = `damage-popup ${isCritical ? 'critical' : ''}`;
  damageElement.textContent = `-${damage}`;

  // Positionner
  const rect = target.getBoundingClientRect();
  damageElement.style.position = 'fixed';
  damageElement.style.left = `${rect.left + rect.width / 2}px`;
  damageElement.style.top = `${rect.top}px`;

  document.body.appendChild(damageElement);

  // Animation
  setTimeout(() => {
    damageElement.remove();
  }, 1000);
}

/**
 * Anime le gain de loot
 * @param {Object} item - L'item obtenu
 */
function animateLootDrop(item) {
  const lootElement = document.createElement('div');
  lootElement.className = 'loot-popup';
  lootElement.innerHTML = `
    <span class="loot-icon">${item.icon}</span>
    <span class="loot-name rarity-${item.rarity}">${item.name}</span>
  `;

  lootElement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: var(--bg-card);
    border: 2px solid ${RARITIES[item.rarity].color};
    border-radius: var(--border-radius);
    padding: 1rem 2rem;
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 0 30px ${RARITIES[item.rarity].color}40;
    animation: lootPop 0.5s ease forwards;
  `;

  document.body.appendChild(lootElement);

  setTimeout(() => {
    lootElement.style.animation = 'lootFade 0.3s ease forwards';
    setTimeout(() => lootElement.remove(), 300);
  }, 2000);
}

/**
 * Anime le level up
 * @param {number} newLevel - Nouveau niveau
 */
function animateLevelUp(newLevel) {
  const levelUpElement = document.createElement('div');
  levelUpElement.className = 'levelup-popup';
  levelUpElement.innerHTML = `
    <div class="levelup-text">NIVEAU SUPÉRIEUR !</div>
    <div class="levelup-level">${newLevel}</div>
    <div class="levelup-bonus">+5 points de stats</div>
  `;

  levelUpElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    z-index: 4000;
    animation: levelUpFadeIn 0.5s ease forwards;
  `;

  document.body.appendChild(levelUpElement);

  setTimeout(() => {
    levelUpElement.style.animation = 'levelUpFadeOut 0.5s ease forwards';
    setTimeout(() => levelUpElement.remove(), 500);
  }, 2500);
}

/**
 * Anime le gain d'or
 * @param {number} amount - Montant d'or gagné
 */
function animateGoldGain(amount) {
  const goldDisplay = document.getElementById('gold-amount');
  if (!goldDisplay) return;

  const popup = document.createElement('span');
  popup.className = 'gold-popup';
  popup.textContent = `+${amount}`;
  popup.style.cssText = `
    position: absolute;
    color: var(--accent-gold);
    font-weight: bold;
    animation: floatUp 1s ease forwards;
    pointer-events: none;
  `;

  goldDisplay.parentElement.style.position = 'relative';
  goldDisplay.parentElement.appendChild(popup);

  setTimeout(() => popup.remove(), 1000);
}

/**
 * Anime le shake d'un élément (pour les erreurs)
 * @param {HTMLElement} element - L'élément à secouer
 */
function animateShake(element) {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = 'shake 0.5s ease';
}

/**
 * Anime le pulse d'un élément (pour attirer l'attention)
 * @param {HTMLElement} element - L'élément
 */
function animatePulse(element) {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = 'pulse 0.5s ease';
}

// Ajouter les styles d'animation dynamiquement
const animationStyles = document.createElement('style');
animationStyles.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes lootPop {
    0% { transform: translate(-50%, -50%) scale(0); }
    70% { transform: translate(-50%, -50%) scale(1.1); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }

  @keyframes lootFade {
    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }

  @keyframes levelUpFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes levelUpFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes floatUp {
    0% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-30px); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes damageFloat {
    0% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -50px); }
  }

  .damage-popup {
    color: #ff4444;
    font-size: 1.5rem;
    font-weight: bold;
    animation: damageFloat 1s ease forwards;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 3000;
  }

  .damage-popup.critical {
    color: #ffaa00;
    font-size: 2rem;
  }

  .levelup-popup {
    text-align: center;
  }

  .levelup-text {
    font-family: var(--font-display);
    font-size: 2rem;
    color: var(--accent-gold);
    text-shadow: 0 0 20px var(--accent-gold);
    margin-bottom: 1rem;
    animation: pulse 0.5s ease infinite;
  }

  .levelup-level {
    font-size: 5rem;
    font-weight: bold;
    color: white;
    text-shadow: 0 0 30px var(--accent-gold);
  }

  .levelup-bonus {
    font-size: 1.2rem;
    color: var(--success);
    margin-top: 1rem;
  }

  .loot-icon {
    font-size: 2rem;
  }

  .loot-name {
    font-weight: bold;
  }
`;

document.head.appendChild(animationStyles);

// Export pour utilisation globale
window.animateElement = animateElement;
window.animateDamage = animateDamage;
window.animateLootDrop = animateLootDrop;
window.animateLevelUp = animateLevelUp;
window.animateGoldGain = animateGoldGain;
window.animateShake = animateShake;
window.animatePulse = animatePulse;
