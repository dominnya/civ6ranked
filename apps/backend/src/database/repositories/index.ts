import { game } from '~/database/repositories/game';
import { lobby } from '~/database/repositories/lobby';
import { player } from '~/database/repositories/player';

export const repo = {
  game,
  lobby,
  player,
};
