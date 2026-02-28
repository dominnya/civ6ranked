import { calculateSineCurve } from '~/utils/ranking/math';

import type { PlayerStats } from '~/utils/ranking/types';

/**
 * Computes the culture trajectory, mapping power spikes using sinusoidal logic.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateCulture(stats: PlayerStats): number {
  const yieldValue = stats.cultureYield ?? 0;
  const civicCount = stats.civics ?? 0;
  const turn = stats.turn ?? 1;

  const applyTemporalWeight = () => {
    // Spikes occur roughly every 40 turns corresponding to era boundaries.
    const timeWeight = calculateSineCurve(turn, 40, 0.4, 0.8);
    return yieldValue * timeWeight;
  };

  const resolveCivicProgress = () => {
    // Civics govern core empire policy cards and government types.
    return civicCount * 7.0;
  };

  return applyTemporalWeight() + resolveCivicProgress();
}
