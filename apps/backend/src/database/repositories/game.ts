import { db } from '~/database';
import { machine as repoMachine } from '~/database/repositories/machine';
import { GameMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';

import type { Lobby } from '~/database/repositories/lobby';

async function finish(lobby: Lobby) {
  const machine = await repoMachine.getById(lobby.machine_id);
  if (!machine) throw GameMessage.NO_AVAILABLE_MACHINE;

  const response = await bfetch('/game', {
    method: 'delete',
    machine,
  });

  const updatedLobby = await db<{ match_id: number }[]>`UPDATE lobby SET is_active = false WHERE id = ${lobby.id} RETURNING match_id`;
  if (response.message !== 'LEFT') throw response.message;

  // TODO: Logic to create match result

  return { id: lobby.id, match_id: updatedLobby[0].match_id, match_result_id: 0, finished_at: new Date().toISOString() };
}

export const game = {
  finish,
};
