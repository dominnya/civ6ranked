/** Maximum possible rating ranking increase for a flawless game state. */
export const RR_CAP_POSITIVE = 40;

/** Maximum possible rating ranking decrease for an entirely collapsed game state. */
export const RR_CAP_NEGATIVE = -30;

/** Hard limit on the percentage lobby gravity can manipulate the base RR. */
export const LOBBY_ADJUSTMENT_MAX_PERCENT = 0.5;

/** Hard limit on the percentage historical streaks can manipulate the adjusted RR. */
export const STREAK_ADJUSTMENT_MAX_PERCENT = 0.1;

/** Default placement Elo for newly observed players in the ecosystem. */
export const ELO_DEFAULT_PLACEMENT = 500;

/** Standard deviation constant for logistic win probability distribution. */
export const ELO_LOGISTIC_DIVISOR = 400;

/** Era thresholds mapped to expected network speed turns. */
export const ERA_TURN_THRESHOLDS = {
  CLASSICAL: 20,
  MEDIEVAL: 40,
  RENAISSANCE: 60,
  INDUSTRIAL: 80,
  MODERN: 100,
} as const;
