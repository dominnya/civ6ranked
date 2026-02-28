import {
  RR_CAP_POSITIVE,
  RR_CAP_NEGATIVE,
  LOBBY_ADJUSTMENT_MAX_PERCENT,
  STREAK_ADJUSTMENT_MAX_PERCENT,
  ELO_LOGISTIC_DIVISOR,
} from '~/utils/ranking/constants';

import type { PlayerHistory } from '~/utils/ranking/types';

/**
 * Step 1: Translates the normalized promise score (0-100) into the baseline Rating Ranking (-30 to +40).
 * @param percentage The normalized promise score.
 */
export function calculateBaselineRR(percentage: number): number {
  const range = RR_CAP_POSITIVE - RR_CAP_NEGATIVE;
  const ratio = percentage / 100;

  return RR_CAP_NEGATIVE + range * ratio;
}

/**
 * Step 2: Applies a gravitational pull to the RR based on player Elo versus the lobby average.
 * @param baseRR The RR derived strictly from the statistical snapshot.
 * @param playerElo The current rating of the player.
 * @param averageLobbyElo The mean rating of all competitors.
 */
export function applyLobbyGravity(baseRR: number, playerElo: number, averageLobbyElo: number): number {
  const delta = playerElo - averageLobbyElo;

  const determineShift = () => {
    // Clamp standard deviation variance between -1 and 1.
    const variance = Math.max(-1, Math.min(1, delta / ELO_LOGISTIC_DIVISOR));
    const capModifier = Math.abs(variance) * LOBBY_ADJUSTMENT_MAX_PERCENT;

    // Higher Elo player wins: reduced gain.
    if (baseRR > 0 && variance > 0) return baseRR * (1 - capModifier);
    // Higher Elo player loses: amplified loss.
    if (baseRR < 0 && variance > 0) return baseRR * (1 + capModifier);
    // Lower Elo player wins: amplified gain.
    if (baseRR > 0 && variance < 0) return baseRR * (1 + capModifier);
    // Lower Elo player loses: reduced loss.
    if (baseRR < 0 && variance < 0) return baseRR * (1 - capModifier);

    return baseRR;
  };

  return determineShift();
}

/**
 * Step 3: Manipulates the final RR based on psychological momentum strings.
 * @param adjustedRR The RR following lobby gravity recalibration.
 * @param history The player's historical win/loss data.
 */
export function applyMomentumStreak(adjustedRR: number, history: PlayerHistory): number {
  const streakCount = history.streak || 0;

  const determineMomentum = () => {
    if (streakCount === 0) return adjustedRR;

    // Soft cap streak momentum at 5 games to satisfy the 10% maximum variance limit.
    const cappedStreak = Math.min(5, streakCount);
    const momentumWeight = (cappedStreak / 5) * STREAK_ADJUSTMENT_MAX_PERCENT;

    // Winning streak amplifies gains, dampens losses.
    if (history.type === 'W' && adjustedRR > 0) return adjustedRR * (1 + momentumWeight);
    if (history.type === 'W' && adjustedRR < 0) return adjustedRR * (1 - momentumWeight);

    // Losing streak amplifies losses, dampens gains.
    if (history.type === 'L' && adjustedRR < 0) return adjustedRR * (1 + momentumWeight);
    if (history.type === 'L' && adjustedRR > 0) return adjustedRR * (1 - momentumWeight);

    return adjustedRR;
  };

  return determineMomentum();
}
