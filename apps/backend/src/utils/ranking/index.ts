// virtual_file: src/index.ts
import { ELO_DEFAULT_PLACEMENT } from '~/utils/ranking/constants';
import { generateNormalizedPromiseScores } from '~/utils/ranking/engine/aggregator';
import { calculateBaselineRR, applyLobbyGravity, applyMomentumStreak } from '~/utils/ranking/engine/elo-modifiers';

import type { PlayerStats, PlayerElo, PlayerHistory, EvaluationState, PlayerRR } from '~/utils/ranking/types';

/**
 * Helper to extract an Elo rating from the current state array, applying the default if unranked.
 * @param id The target player identifier.
 * @param currentElos The state array of existing Elo ratings.
 */
const extractElo = (id: string, currentElos: PlayerElo[]): number => {
  const match = currentElos.filter(e => e.ingameId === id);
  return match.length > 0 ? match[0].elo : ELO_DEFAULT_PLACEMENT;
};

/**
 * Helper to extract history, generating a pristine state if no history is logged.
 * @param id The target player identifier.
 * @param histories The state array of historical momentum.
 */
const extractHistory = (id: string, histories: PlayerHistory[]): PlayerHistory => {
  const match = histories.filter(h => h.ingameId === id);
  return match.length > 0 ? match[0] : { ingameId: id, type: 'W', streak: 0 };
};

/**
 * Core Orchestrator: Processes game telemetry arrays.
 * @param stats Array containing the end-of-game snapshot for all competitors.
 * @param currentElos Array containing the pre-game Elo rankings for all competitors.
 * @param histories Array containing the momentum histories for all competitors.
 */
export function createEloPipeline(stats: PlayerStats[], currentElos: PlayerElo[], histories: PlayerHistory[]) {
  const calculateMeanLobbyElo = () => {
    const total = stats.reduce((sum, s) => sum + extractElo(s.player, currentElos), 0);
    return total / stats.length;
  };

  const averageLobbyElo = calculateMeanLobbyElo();
  const normalizedScores = generateNormalizedPromiseScores(stats);

  const processCompetitor = (item: { id: string; score: number }): EvaluationState => {
    const elo = extractElo(item.id, currentElos);
    const hist = extractHistory(item.id, histories);

    const baseRR = calculateBaselineRR(item.score);
    const lobbyAdjustedRR = applyLobbyGravity(baseRR, elo, averageLobbyElo);
    const finalRR = applyMomentumStreak(lobbyAdjustedRR, hist);

    return {
      ingameId: item.id,
      promiseScore: item.score,
      normalizedScore: item.score,
      baseRR,
      lobbyAdjustedRR,
      finalRR,
      originalElo: elo,
      newElo: Math.max(0, elo + finalRR), // Floor the Elo at Iron 1 threshold (0).
    };
  };

  const projectResults = (evaluated: EvaluationState[]): PlayerRR[] => {
    // Descending sort based on absolute promise score to determine lobby placement.
    const sorted = evaluated.sort((a, b) => b.promiseScore - a.promiseScore);

    const formatPayload = (state: EvaluationState): PlayerRR => ({
      ingameId: state.ingameId,
      rr: Math.round(state.finalRR),
      elo: Math.round(state.newElo),
    });

    return sorted.map(formatPayload);
  };

  return { results: () => projectResults(normalizedScores.map(processCompetitor)) };
}
