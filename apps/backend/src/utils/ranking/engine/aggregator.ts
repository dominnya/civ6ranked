import { evaluateEmpireFootprint, evaluateUrbanDensity } from '~/utils/ranking/evaluators/infrastructure';
import { evaluateMilitaryThreat, evaluateAlternativeThreats } from '~/utils/ranking/evaluators/military';
import { evaluateCulture } from '~/utils/ranking/evaluators/yield-culture';
import { evaluateFoundationalEconomy, evaluateLiquidEconomy } from '~/utils/ranking/evaluators/yield-economy';
import { evaluateScience } from '~/utils/ranking/evaluators/yield-science';
import { normalizeDistribution } from '~/utils/ranking/math';

import type { PlayerStats } from '~/utils/ranking/types';

/**
 * Executes all evaluation modules and sums the outputs to form the absolute Promise Score.
 * @param stats The telemetry payload for a single player.
 */
export function calculateAbsolutePromiseScore(stats: PlayerStats): number {
  const getYieldScore = () => {
    return evaluateScience(stats) + evaluateCulture(stats) + evaluateFoundationalEconomy(stats) + evaluateLiquidEconomy(stats);
  };

  const getInfraScore = () => {
    return evaluateEmpireFootprint(stats) + evaluateUrbanDensity(stats);
  };

  const getThreatScore = () => {
    return evaluateMilitaryThreat(stats) + evaluateAlternativeThreats(stats);
  };

  return getYieldScore() + getInfraScore() + getThreatScore();
}

/**
 * Maps an entire lobby of raw telemetry to normalized percentage scores (0 to 100).
 * @param lobbyStats The array of all player telemetry objects.
 */
export function generateNormalizedPromiseScores(lobbyStats: PlayerStats[]): { id: string; score: number }[] {
  const rawScores = lobbyStats.map(calculateAbsolutePromiseScore);
  const normalizedScale = normalizeDistribution(rawScores);

  const formatOutput = (val: number, index: number) => {
    return {
      id: lobbyStats[index].player,
      score: val * 100,
    };
  };

  return normalizedScale.map(formatOutput);
}
