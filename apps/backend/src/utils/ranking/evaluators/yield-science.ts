import { calculateLogisticCurve } from '~/utils/ranking/math';

import type { PlayerStats } from '~/utils/ranking/types';

/**
 * Computes the science trajectory, applying exponential weight in the late game.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateScience(stats: PlayerStats): number {
  const yieldValue = stats.scienceYield ?? 0;
  const techCount = stats.technologies ?? 0;
  const turn = stats.turn ?? 1;

  const applyTemporalWeight = () => {
    // Science reaches critical mass around turn 70 (Industrialization/Flight).
    const timeWeight = calculateLogisticCurve(turn, 70, 0.1);
    return yieldValue * timeWeight;
  };

  const resolveTechProgress = () => {
    // Flat points per technology researched ensure baseline momentum is tracked.
    return techCount * 8.5;
  };

  return applyTemporalWeight() + resolveTechProgress();
}
