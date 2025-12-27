/* ==============================================
   ELANIA RPG - Système d'Arène PvP
   ============================================== */

const ARENA_CONFIG = {
  maxFightsPerDay: 10,
  opponentsCount: 10,
  pointsWin: 10,
  pointsLoss: -5,
  refreshInterval: 3600000 // 1 heure en ms
};

/**
 * Récupère ou initialise les données d'arène
 * @returns {Object} Données d'arène
 */
function getArenaData() {
  let arena = Storage.loadArena();

  // Vérifier si on doit reset les combats du jour
  const today = new Date().toDateString();
  if (arena.lastReset !== today) {
    arena.fightsToday = ARENA_CONFIG.maxFightsPerDay;
    arena.lastReset = today;
    Storage.saveArena(arena);
  }

  return arena;
}

/**
 * Génère un adversaire d'arène
 * @param {number} playerLevel - Niveau du joueur
 * @returns {Object} Adversaire généré
 */
function generateArenaOpponent(playerLevel) {
  // Niveau de l'adversaire (+/- 3 niveaux)
  const levelVariation = Helpers.randomInt(-3, 3);
  const level = Math.max(1, playerLevel + levelVariation);

  // Stats de base aléatoires (total similaire au joueur)
  const totalPoints = 25 + (level - 1) * 5;
  const baseStats = distributeRandomStats(totalPoints);

  // Génération de l'équipement fictif
  const equipmentBonus = generateFakeEquipmentBonus(level);

  // Calculer les stats finales
  const combinedStats = {
    strength: baseStats.strength + equipmentBonus.strength,
    agility: baseStats.agility + equipmentBonus.agility,
    intelligence: baseStats.intelligence + equipmentBonus.intelligence,
    endurance: baseStats.endurance + equipmentBonus.endurance,
    luck: baseStats.luck + equipmentBonus.luck
  };

  const derivedStats = calculateDerivedStats(combinedStats, equipmentBonus);

  return {
    id: Helpers.generateId(),
    name: Helpers.generateRandomName(),
    level,
    icon: Helpers.randomElement(['⚔️', '🛡️', '🗡️', '🏹', '🔮', '⚡', '🔥', '❄️']),
    stats: derivedStats,
    baseStats: combinedStats,
    currentHp: derivedStats.maxHp,
    maxHp: derivedStats.maxHp,
    arenaPoints: Helpers.randomInt(level * 5, level * 20)
  };
}

/**
 * Distribue des points de stats aléatoirement
 * @param {number} totalPoints - Points totaux à distribuer
 * @returns {Object} Stats distribuées
 */
function distributeRandomStats(totalPoints) {
  const stats = {
    strength: 5,
    agility: 5,
    intelligence: 5,
    endurance: 5,
    luck: 5
  };

  const statNames = Object.keys(stats);
  let remaining = totalPoints - 25; // On retire les points de base

  while (remaining > 0) {
    const stat = Helpers.randomElement(statNames);
    const points = Math.min(remaining, Helpers.randomInt(1, 3));
    stats[stat] += points;
    remaining -= points;
  }

  return stats;
}

/**
 * Génère des bonus d'équipement fictifs
 * @param {number} level - Niveau de l'adversaire
 * @returns {Object} Bonus d'équipement
 */
function generateFakeEquipmentBonus(level) {
  const bonus = {
    strength: 0,
    agility: 0,
    intelligence: 0,
    endurance: 0,
    luck: 0,
    maxHp: 0,
    attack: 0,
    defense: 0
  };

  // Ajouter des bonus basés sur le niveau
  const totalBonus = Math.floor(level * 2);
  const statNames = ['strength', 'agility', 'intelligence', 'endurance', 'luck'];

  for (let i = 0; i < totalBonus; i++) {
    const stat = Helpers.randomElement(statNames);
    bonus[stat]++;
  }

  // Bonus de défense et attaque
  bonus.defense = Math.floor(level * 0.5);
  bonus.attack = Math.floor(level * 0.3);
  bonus.maxHp = level * 5;

  return bonus;
}

/**
 * Génère la liste des adversaires d'arène
 * @returns {Array} Liste des adversaires
 */
function generateArenaOpponents() {
  const character = loadCharacter();
  const opponents = [];

  for (let i = 0; i < ARENA_CONFIG.opponentsCount; i++) {
    opponents.push(generateArenaOpponent(character.level));
  }

  // Trier par niveau
  opponents.sort((a, b) => a.level - b.level);

  return opponents;
}

/**
 * Rafraîchit les adversaires si nécessaire
 * @returns {Array} Liste des adversaires actuels
 */
function refreshArenaOpponents() {
  const arena = getArenaData();
  const now = Date.now();

  // Vérifier si on doit rafraîchir
  if (!arena.opponents ||
      arena.opponents.length === 0 ||
      !arena.lastOpponentRefresh ||
      now - arena.lastOpponentRefresh > ARENA_CONFIG.refreshInterval) {

    arena.opponents = generateArenaOpponents();
    arena.lastOpponentRefresh = now;
    Storage.saveArena(arena);
  }

  return arena.opponents;
}

/**
 * Lance un combat d'arène
 * @param {string} opponentId - ID de l'adversaire
 * @returns {Object} Résultat du combat
 */
function startArenaFight(opponentId) {
  const arena = getArenaData();

  // Vérifier les combats restants
  if (arena.fightsToday <= 0) {
    return {
      success: false,
      message: 'Plus de combats disponibles aujourd\'hui'
    };
  }

  // Trouver l'adversaire
  const opponent = arena.opponents.find(o => o.id === opponentId);
  if (!opponent) {
    return { success: false, message: 'Adversaire non trouvé' };
  }

  const character = loadCharacter();

  // Préparer les combattants
  const playerCombatant = createPlayerCombatant(character);
  const opponentCombatant = {
    ...opponent,
    isPlayer: false,
    goldReward: { min: 0, max: 0 },
    xpReward: 0
  };

  // Exécuter le combat
  const combatResult = executeCombat(playerCombatant, opponentCombatant);

  // Appliquer les résultats
  const pointsChange = combatResult.victory ?
    ARENA_CONFIG.pointsWin :
    ARENA_CONFIG.pointsLoss;

  arena.points = Math.max(0, arena.points + pointsChange);
  arena.fightsToday--;
  Storage.saveArena(arena);

  // Soigner le joueur après le combat
  healCharacter(character, -1);

  return {
    success: true,
    victory: combatResult.victory,
    combatLog: combatResult.log,
    turns: combatResult.turns,
    pointsChange,
    newPoints: arena.points,
    fightsRemaining: arena.fightsToday
  };
}

/**
 * Génère le classement de l'arène
 * @returns {Array} Classement avec le joueur
 */
function generateArenaLeaderboard() {
  const character = loadCharacter();
  const arena = getArenaData();

  // Générer des joueurs fictifs
  const leaderboard = [];

  // Ajouter des joueurs mieux classés
  for (let i = 0; i < 5; i++) {
    leaderboard.push({
      rank: i + 1,
      name: Helpers.generateRandomName(),
      level: character.level + Helpers.randomInt(0, 5),
      points: arena.points + Helpers.randomInt(50, 200) * (5 - i),
      isPlayer: false
    });
  }

  // Ajouter le joueur
  const playerRank = Helpers.randomInt(6, 15);
  leaderboard.push({
    rank: playerRank,
    name: character.name,
    level: character.level,
    points: arena.points,
    isPlayer: true
  });

  // Ajouter des joueurs moins bien classés
  for (let i = 0; i < 4; i++) {
    leaderboard.push({
      rank: playerRank + i + 1,
      name: Helpers.generateRandomName(),
      level: Math.max(1, character.level - Helpers.randomInt(0, 3)),
      points: Math.max(0, arena.points - Helpers.randomInt(10, 100) * (i + 1)),
      isPlayer: false
    });
  }

  // Trier par rang
  leaderboard.sort((a, b) => a.rank - b.rank);

  return leaderboard;
}

/**
 * Récupère les infos d'arène du joueur
 * @returns {Object} Infos d'arène
 */
function getArenaInfo() {
  const arena = getArenaData();

  return {
    points: arena.points,
    fightsRemaining: arena.fightsToday,
    maxFights: ARENA_CONFIG.maxFightsPerDay
  };
}

// Export pour utilisation globale
window.ARENA_CONFIG = ARENA_CONFIG;
window.getArenaData = getArenaData;
window.generateArenaOpponents = generateArenaOpponents;
window.refreshArenaOpponents = refreshArenaOpponents;
window.startArenaFight = startArenaFight;
window.generateArenaLeaderboard = generateArenaLeaderboard;
window.getArenaInfo = getArenaInfo;
