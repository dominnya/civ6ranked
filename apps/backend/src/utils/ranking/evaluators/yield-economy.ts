import { calculateLogarithmicDecay, calculateLogisticCurve } from '~/utils/ranking/math';

import type { PlayerStats } from '~/utils/ranking/types';

/**
 * Computes foundational yields (food/production) which decay in value over time.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateFoundationalEconomy(stats: PlayerStats): number {
  const production = stats.productionYield ?? 0;
  const food = stats.foodYield ?? 0;
  const turn = stats.turn ?? 1;

  const applyDecayModifier = () => {
    // Production and food lose comparative value as game transitions to gold purchasing.
    const decay = calculateLogarithmicDecay(turn, 6);
    return (production * 1.5 + food) * decay;
  };

  return applyDecayModifier();
}

/**
 * Computes liquid yields (gold/faith) which gain exponential value over time.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateLiquidEconomy(stats: PlayerStats): number {
  const gold = stats.goldYield ?? 0;
  const faith = stats.faithYield ?? 0;
  const turn = stats.turn ?? 1;

  const applyLogisticModifier = () => {
    // Gold overtakes production around turn 75.
    const goldMultiplier = calculateLogisticCurve(turn, 75, 0.08) + 0.5;
    const faithMultiplier = calculateLogisticCurve(turn, 60, 0.05);

    return gold * goldMultiplier + faith * faithMultiplier;
  };

  return applyLogisticModifier();
}
