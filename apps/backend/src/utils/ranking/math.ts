/**
 * Calculates a standard S-curve multiplier, utilized for science and gold late-game scaling.
 * @param x The current turn value.
 * @param midpoint The turn at which the multiplier reaches 0.5.
 * @param steepness The aggression of the exponential curve.
 */
export function calculateLogisticCurve(x: number, midpoint: number, steepness: number): number {
  const exponent = -steepness * (x - midpoint);
  return 1 / (1 + Math.exp(exponent));
}

/**
 * Calculates a sinusoidal multiplier to represent cyclical civic power spikes.
 * @param x The current turn value.
 * @param period The wavelength representing the turn gap between peaks.
 * @param amplitude The height of the multiplier variance.
 * @param baseline The minimum guaranteed weight factor.
 */
export function calculateSineCurve(x: number, period: number, amplitude: number, baseline: number): number {
  const modifier = Math.sin((Math.PI * x) / period);
  return baseline + amplitude * modifier;
}

/**
 * Calculates a logarithmic decay modifier for early-game foundational yields.
 * @param x The current turn value.
 * @param decayRate The speed at which the modifier approaches zero.
 */
export function calculateLogarithmicDecay(x: number, decayRate: number): number {
  const safeValue = Math.max(1, x);
  const decay = 1 - Math.log(safeValue) / decayRate;
  return Math.max(0.1, decay);
}

/**
 * Distributes an array of raw numerical values linearly onto a 0 to 1 scale.
 * @param data Array of numbers to normalize.
 */
export function normalizeDistribution(data: number[]): number[] {
  const max = Math.max(...data);
  const min = Math.min(...data);

  const processScale = (val: number) => {
    return max === min ? 0.5 : (val - min) / (max - min);
  };

  return data.map(processScale);
}
