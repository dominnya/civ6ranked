import type { PlayerStats } from '~/utils/ranking/types';

/**
 * Computes the physical footprint of the empire, penalizing tall cities without infrastructure.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateEmpireFootprint(stats: PlayerStats): number {
  const cities = stats.numCities ?? 0;
  const pop = stats.population ?? 0;
  const improved = stats.tilesImproved ?? 0;

  const calculateExpansion = () => {
    // Wide empires strictly out-scale tall empires in network speed scenarios.
    const cityScore = cities * 20;
    const builderEconomy = improved * 3;

    // Logarithmic curve applied to raw population to prevent overvaluing tall capitals.
    const popScore = pop > 0 ? 12 * Math.log(pop) : 0;

    return cityScore + builderEconomy + popScore;
  };

  return calculateExpansion();
}

/**
 * Computes the density of districts and permanent buildings.
 * @param stats The telemetry payload for a single player.
 */
export function evaluateUrbanDensity(stats: PlayerStats): number {
  const districts = stats.scoreDistricts ?? 0;
  const buildings = stats.scoreBuildings ?? 0;
  const wonders = stats.scoreTiles ?? 0;

  const calculateDensity = () => {
    return districts * 8 + buildings * 4 + wonders * 2;
  };

  return calculateDensity();
}
