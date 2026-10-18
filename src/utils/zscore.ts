import { CategoryKey, Player, PuntState, TeamCategoryStrength, YahooRosterSlot, CATEGORIES } from '../types/fantasy';

/**
 * Computes an adjusted composite Z-score for a player based on active punt categories.
 * Punted categories receive 0 weight in the composite sum.
 */
export function calculateAdjustedZScore(player: Player, punts: PuntState): number {
  const z = player.zScores;
  let sum = 0;
  let activeCategoriesCount = 0;

  if (!punts.pts) { sum += z.zPts; activeCategoriesCount++; }
  if (!punts.reb) { sum += z.zReb; activeCategoriesCount++; }
  if (!punts.ast) { sum += z.zAst; activeCategoriesCount++; }
  if (!punts.tpm) { sum += z.zTpm; activeCategoriesCount++; }
  if (!punts.stl) { sum += z.zStl; activeCategoriesCount++; }
  if (!punts.blk) { sum += z.zBlk; activeCategoriesCount++; }
  if (!punts.fgPct) { sum += z.zFg; activeCategoriesCount++; }
  if (!punts.ftPct) { sum += z.zFt; activeCategoriesCount++; }
  if (!punts.to) { sum += z.zTo; activeCategoriesCount++; }

  if (activeCategoriesCount === 0) return 0;
  // Normalize to 9-category scale for consistent comparison
  return Number(((sum / activeCategoriesCount) * 9).toFixed(2));
}

/**
 * Returns players sorted by adjusted Z-score descending
 */
export function sortPlayersByAdjustedZ(players: Player[], punts: PuntState): (Player & { adjustedZ: number })[] {
  return players
    .map(p => ({
      ...p,
      adjustedZ: calculateAdjustedZScore(p, punts),
    }))
    .sort((a, b) => b.adjustedZ - a.adjustedZ);
}

/**
 * Calculates team category totals, averages, and grades against 12-team Yahoo standard benchmarks
 */
export function calculateTeamCategoryStrengths(
  teamPlayers: Player[],
  punts: PuntState
): Record<CategoryKey, TeamCategoryStrength> {
  const n = teamPlayers.length;

  const result: Partial<Record<CategoryKey, TeamCategoryStrength>> = {};

  CATEGORIES.forEach(cat => {
    const key = cat.key;
    const isPunted = !!punts[key];

    if (n === 0) {
      result[key] = {
        key,
        totalRaw: 0,
        averageRaw: 0,
        totalZScore: 0,
        averageZScore: 0,
        grade: 'C',
        isPunted,
      };
      return;
    }

    let totalRaw = 0;
    let totalZ = 0;

    teamPlayers.forEach(p => {
      totalRaw += p.stats[key];
      switch (key) {
        case 'pts': totalZ += p.zScores.zPts; break;
        case 'reb': totalZ += p.zScores.zReb; break;
        case 'ast': totalZ += p.zScores.zAst; break;
        case 'tpm': totalZ += p.zScores.zTpm; break;
        case 'stl': totalZ += p.zScores.zStl; break;
        case 'blk': totalZ += p.zScores.zBlk; break;
        case 'fgPct': totalZ += p.zScores.zFg; break;
        case 'ftPct': totalZ += p.zScores.zFt; break;
        case 'to': totalZ += p.zScores.zTo; break;
      }
    });

    const averageRaw = key === 'fgPct' || key === 'ftPct' ? totalRaw / n : totalRaw / n;
    const averageZ = totalZ / n;

    // Grade assignment based on cumulative team Z-score relative to roster size
    let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' = 'C';
    const benchmark = averageZ;
    if (benchmark >= 1.5) grade = 'A+';
    else if (benchmark >= 1.0) grade = 'A';
    else if (benchmark >= 0.5) grade = 'B+';
    else if (benchmark >= 0.0) grade = 'B';
    else if (benchmark >= -0.5) grade = 'C+';
    else if (benchmark >= -1.0) grade = 'C';
    else if (benchmark >= -1.5) grade = 'D';
    else grade = 'F';

    result[key] = {
      key,
      totalRaw: Number(totalRaw.toFixed(1)),
      averageRaw: Number(averageRaw.toFixed(1)),
      totalZScore: Number(totalZ.toFixed(2)),
      averageZScore: Number(averageZ.toFixed(2)),
      grade,
      isPunted,
    };
  });

  return result as Record<CategoryKey, TeamCategoryStrength>;
}

/**
 * Initializes empty standard Yahoo 13-man roster slots
 */
export function createInitialYahooRoster(): YahooRosterSlot[] {
  return [
    { slotKey: 'pg', slotName: 'PG', displayLabel: 'PG', eligiblePositions: ['PG'], assignedPlayer: null },
    { slotKey: 'sg', slotName: 'SG', displayLabel: 'SG', eligiblePositions: ['SG'], assignedPlayer: null },
    { slotKey: 'g', slotName: 'G', displayLabel: 'G', eligiblePositions: ['PG', 'SG'], assignedPlayer: null },
    { slotKey: 'sf', slotName: 'SF', displayLabel: 'SF', eligiblePositions: ['SF'], assignedPlayer: null },
    { slotKey: 'pf', slotName: 'PF', displayLabel: 'PF', eligiblePositions: ['PF'], assignedPlayer: null },
    { slotKey: 'f', slotName: 'F', displayLabel: 'F', eligiblePositions: ['SF', 'PF'], assignedPlayer: null },
    { slotKey: 'c1', slotName: 'C1', displayLabel: 'C', eligiblePositions: ['C'], assignedPlayer: null },
    { slotKey: 'c2', slotName: 'C2', displayLabel: 'C', eligiblePositions: ['C'], assignedPlayer: null },
    { slotKey: 'util1', slotName: 'Util1', displayLabel: 'Util', eligiblePositions: ['PG', 'SG', 'SF', 'PF', 'C'], assignedPlayer: null },
    { slotKey: 'util2', slotName: 'Util2', displayLabel: 'Util', eligiblePositions: ['PG', 'SG', 'SF', 'PF', 'C'], assignedPlayer: null },
    { slotKey: 'bn1', slotName: 'BN1', displayLabel: 'BN', eligiblePositions: ['PG', 'SG', 'SF', 'PF', 'C'], assignedPlayer: null },
    { slotKey: 'bn2', slotName: 'BN2', displayLabel: 'BN', eligiblePositions: ['PG', 'SG', 'SF', 'PF', 'C'], assignedPlayer: null },
    { slotKey: 'bn3', slotName: 'BN3', displayLabel: 'BN', eligiblePositions: ['PG', 'SG', 'SF', 'PF', 'C'], assignedPlayer: null },
  ];
}

/**
 * Automatically places a newly drafted player into the most specific open Yahoo roster slot
 */
export function assignPlayerToBestSlot(slots: YahooRosterSlot[], player: Player): YahooRosterSlot[] {
  const updated = slots.map(s => ({ ...s }));

  // Priority order: Exact position -> Flex (G/F) -> Util -> Bench
  // 1. Exact primary position match (PG, SG, SF, PF, C1, C2)
  for (const pos of player.positions) {
    const slot = updated.find(s => s.assignedPlayer === null && s.slotName === pos);
    if (slot) {
      slot.assignedPlayer = player;
      return updated;
    }
  }

  // 2. Specific C slots (C1 or C2) if player is Center
  if (player.positions.includes('C')) {
    const cSlot = updated.find(s => s.assignedPlayer === null && (s.slotName === 'C1' || s.slotName === 'C2'));
    if (cSlot) {
      cSlot.assignedPlayer = player;
      return updated;
    }
  }

  // 3. G slot if player is PG or SG
  if (player.positions.includes('PG') || player.positions.includes('SG')) {
    const gSlot = updated.find(s => s.assignedPlayer === null && s.slotName === 'G');
    if (gSlot) {
      gSlot.assignedPlayer = player;
      return updated;
    }
  }

  // 4. F slot if player is SF or PF
  if (player.positions.includes('SF') || player.positions.includes('PF')) {
    const fSlot = updated.find(s => s.assignedPlayer === null && s.slotName === 'F');
    if (fSlot) {
      fSlot.assignedPlayer = player;
      return updated;
    }
  }

  // 5. Util slots (Util1, Util2)
  const utilSlot = updated.find(s => s.assignedPlayer === null && (s.slotName === 'Util1' || s.slotName === 'Util2'));
  if (utilSlot) {
    utilSlot.assignedPlayer = player;
    return updated;
  }

  // 6. Bench slots (BN1, BN2, BN3)
  const bnSlot = updated.find(s => s.assignedPlayer === null && s.slotName.startsWith('BN'));
  if (bnSlot) {
    bnSlot.assignedPlayer = player;
    return updated;
  }

  return updated;
}

/**
 * Removes a player from the user's roster slots
 */
export function removePlayerFromRoster(slots: YahooRosterSlot[], playerId: string): YahooRosterSlot[] {
  return slots.map(s => {
    if (s.assignedPlayer && s.assignedPlayer.id === playerId) {
      return { ...s, assignedPlayer: null };
    }
    return s;
  });
}

/**
 * Detects positional scarcity among currently available players
 */
export function analyzePositionalScarcity(availablePlayers: Player[]): {
  eliteAssistsLeft: number;
  eliteBlocksLeft: number;
  centersLeft: number;
  pointGuardsLeft: number;
} {
  return {
    eliteAssistsLeft: availablePlayers.filter(p => p.stats.ast >= 7.0).length,
    eliteBlocksLeft: availablePlayers.filter(p => p.stats.blk >= 1.8).length,
    centersLeft: availablePlayers.filter(p => p.positions.includes('C')).length,
    pointGuardsLeft: availablePlayers.filter(p => p.positions.includes('PG')).length,
  };
}
