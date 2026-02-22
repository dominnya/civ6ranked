import type { paths } from '~types';

export function parseWL(history: paths['/profile/history']['get']['responses']['200']['content']['application/json']) {
  const wins = history.history.filter(item => item.elo > 0).length;
  const losses = history.history.filter(item => item.place <= 0).length;

  return { wins, losses, toString: () => `W: ${wins}, L: ${losses}` };
}
