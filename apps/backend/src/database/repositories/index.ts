import { game } from '~/database/repositories/game';
import { lobby } from '~/database/repositories/lobby';
import { machine } from '~/database/repositories/machine';
import { player } from '~/database/repositories/player';
import { task } from '~/database/repositories/task';

export const repo = {
  game,
  lobby,
  machine,
  player,
  task,
};
