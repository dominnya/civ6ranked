import { db } from '~/database';
import { bfetch } from '~/utils/bfetch';

async function finish(id: number) {
  const updatedLobby = (await db`UPDATE lobby SET is_active = false WHERE id = ${id} RETURNING match_id`) as { match_id: number }[];

  const response = await bfetch('/game', {
    method: 'delete',
  });

  if (response.message !== 'LEFT') throw response.message;

  // TODO: Logic to create match result

  return { id, match_id: updatedLobby[0].match_id, match_result_id: 0, finished_at: new Date().toISOString() };
}

export const game = {
  finish,
};
