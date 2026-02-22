import { db } from '~/database';
import { LobbyMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';

interface Lobby {
  id: number;
  match_id: number;
  owner_id: number;
  code: string;
  is_active: boolean;
  created_at: string;
}

async function resetActive() {
  await db`UPDATE lobby SET is_active = false WHERE is_active = true`;
}

async function join(code: string, ownerId: number): Promise<Lobby> {
  const isActive = (await db`SELECT is_active FROM lobby WHERE is_active = true LIMIT 1`) as { is_active: boolean }[] | undefined;

  if (isActive && isActive.length > 0) throw LobbyMessage.ALREADY_IN_LOBBY;

  const response = await bfetch('/lobby', {
    method: 'post',
    body: {
      code,
    },
  });

  if (response.message !== 'JOINED') throw LobbyMessage[response.message];

  const createdLobby = (await db`INSERT INTO lobby (code, is_active, owner_id) VALUES (${code}, true, ${ownerId}) RETURNING *`) as Lobby[];
  return createdLobby[0];
}

async function leave() {
  const updatedLobby = (await db`UPDATE lobby SET is_active = false WHERE is_active = true RETURNING *`) as Lobby[];

  const response = await bfetch('/lobby', {
    method: 'delete',
  });

  if (response.message !== 'LEFT') throw LobbyMessage[response.message];

  return updatedLobby[0];
}

async function findActive(): Promise<Lobby | null> {
  const activeLobby = (await db`SELECT * FROM lobby WHERE is_active = true LIMIT 1`) as Lobby[] | undefined;

  return activeLobby?.[0] ?? null;
}

export const lobby = {
  join,
  leave,
  resetActive,
  findActive,
};
