export type { PlayerStats } from '~/utils/civ6/types';

/** Existing Elo mapping for a specific player. */
export interface PlayerElo {
  ingameId: string;
  elo: number;
}

/** Post-evaluation RR adjustment for a specific player. */
export interface PlayerRR {
  ingameId: string;
  rr: number;
  // Post-evaluation Elo
  elo: number;
}

/** Historical performance vector tracking momentum streaks. */
export interface PlayerHistory {
  ingameId: string;
  type: 'W' | 'L';
  streak: number;
}

/** Internal state object utilized during the tripartite evaluation pipeline. */
export interface EvaluationState {
  ingameId: string;
  promiseScore: number;
  normalizedScore: number;
  baseRR: number;
  lobbyAdjustedRR: number;
  finalRR: number;
  originalElo: number;
  newElo: number;
}
