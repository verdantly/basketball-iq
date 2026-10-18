export type CategoryKey = 
  | 'fgPct'
  | 'ftPct'
  | 'tpm'
  | 'pts'
  | 'reb'
  | 'ast'
  | 'stl'
  | 'blk'
  | 'to';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  isNegative?: boolean; // turnovers: lower is better
  description: string;
  unit: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'fgPct', label: 'Field Goal %', shortLabel: 'FG%', description: 'Field Goal Percentage', unit: '%' },
  { key: 'ftPct', label: 'Free Throw %', shortLabel: 'FT%', description: 'Free Throw Percentage', unit: '%' },
  { key: 'tpm', label: '3-Pointers Made', shortLabel: '3PM', description: 'Three Pointers Made per game', unit: '/g' },
  { key: 'pts', label: 'Points', shortLabel: 'PTS', description: 'Points per game', unit: '/g' },
  { key: 'reb', label: 'Rebounds', shortLabel: 'REB', description: 'Rebounds per game', unit: '/g' },
  { key: 'ast', label: 'Assists', shortLabel: 'AST', description: 'Assists per game', unit: '/g' },
  { key: 'stl', label: 'Steals', shortLabel: 'STL', description: 'Steals per game', unit: '/g' },
  { key: 'blk', label: 'Blocks', shortLabel: 'BLK', description: 'Blocks per game', unit: '/g' },
  { key: 'to', label: 'Turnovers', shortLabel: 'TO', isNegative: true, description: 'Turnovers per game (lower is better)', unit: '/g' },
];

export type PositionKey = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G' | 'F' | 'Util' | 'BN' | 'IL+';

export interface PlayerStats {
  pts: number;
  reb: number;
  ast: number;
  tpm: number;
  stl: number;
  blk: number;
  fgPct: number;
  fga: number;
  fgm: number;
  ftPct: number;
  fta: number;
  ftm: number;
  to: number;
}

export interface PlayerZScores {
  zPts: number;
  zReb: number;
  zAst: number;
  zTpm: number;
  zStl: number;
  zBlk: number;
  zFg: number;
  zFt: number;
  zTo: number;
  zComposite: number;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  positions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];
  yahooAdp: number;
  yahooRank: number;
  gamesPlayed: number;
  stats: PlayerStats;
  zScores: PlayerZScores;
  injuryRisk: 'low' | 'moderate' | 'high';
  tier: number;
  scoutingNote: string;
  tags?: string[];
}

export type PlayerStatus = 'available' | 'my_team' | 'drafted_other';

export interface DraftPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  teamId: number;
  teamName: string;
  playerId: string;
  player: Player;
  isUserPick: boolean;
  timestamp: number;
}

export interface YahooRosterSlot {
  slotKey: string;
  slotName: 'PG' | 'SG' | 'G' | 'SF' | 'PF' | 'F' | 'C1' | 'C2' | 'Util1' | 'Util2' | 'BN1' | 'BN2' | 'BN3';
  displayLabel: string;
  eligiblePositions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];
  assignedPlayer: Player | null;
}

export type PuntState = Record<CategoryKey, boolean>;

export interface TeamCategoryStrength {
  key: CategoryKey;
  totalRaw: number;
  averageRaw: number;
  totalZScore: number;
  averageZScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  isPunted: boolean;
}

export interface AIRecommendationItem {
  playerId: string;
  playerName: string;
  badge: 'Best Overall Fit' | 'Category Specialist' | 'High-Upside Steal' | 'Positional Need';
  strategicReasoning: string;
  pros: string[];
  risks: string[];
  targetCategories: CategoryKey[];
  rosterFitSlot: string;
}

export interface AIRecommendationResponse {
  recommendations: AIRecommendationItem[];
  overallAssessment: string;
  suggestedPuntPath: string;
  positionalAlert: string;
}

export interface VisionDetectionItem {
  pickNumber?: number;
  teamName?: string;
  playerName: string;
  matchedPlayerId?: string;
  matchedPlayerName?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface VisionDetectionResponse {
  detectedDrafted: VisionDetectionItem[];
  rawSummary: string;
  overallConfidence: 'high' | 'medium' | 'low';
  totalPicksFound: number;
}
