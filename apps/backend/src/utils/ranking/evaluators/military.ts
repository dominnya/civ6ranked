import type { PlayerStats } from '~/utils/ranking/types';

/**
 * Computes military threat projection, correcting internal game engine deflation.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateMilitaryThreat(stats: PlayerStats): number {
  const units = stats.landUnits ?? 0;
  const corps = stats.landCorps ?? 0;
  const armies = stats.landArmies ?? 0;
  const naval = stats.navalUnits ?? 0;

  const compensateDeflation = () => {
    // Artificial multipliers reflect true combat differentials.
    const corpsWeight = corps * 2.8;
    const armyWeight = armies * 4.5;
    const navalWeight = naval * 1.5;

    return units + corpsWeight + armyWeight + navalWeight;
  };

  return compensateDeflation();
}

/**
 * Computes alternative victory vectors and soft-power metrics.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateAlternativeThreats(stats: PlayerStats): number {
  const tourism = stats.tourism ?? 0;
  const diplo = stats.diploVictoryPoints ?? 0;
  const favor = stats.favorLifetime ?? 0;
  const routes = stats.outgoingTradeRoutes ?? 0;

  const calculateSoftPower = () => {
    const tourismThreat = tourism * 2.5;
    const diploThreat = diplo * 40; // Direct win condition scalar.
    const politicalCapital = favor * 0.4;
    const logistics = routes * 12; // Trade routes represent massive late-game flexibility.

    return tourismThreat + diploThreat + politicalCapital + logistics;
  };

  return calculateSoftPower();
}
