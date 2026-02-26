import { db } from '~/database';
import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';

import type { Machine } from '~/database/repositories/machine';

export interface Lobby {
  id: number;
  match_id: number;
  owner_id: number;
  code: string;
  is_active: boolean;
  created_at: string;
  machine_id: number;
}

async function resetActive() {
  await db`UPDATE lobby SET is_active = false WHERE is_active = true`;
}

async function join(code: string, ownerId: number, machine: Machine): Promise<Lobby> {
  const alreadyExists = await getByOwnerId(ownerId);
  if (alreadyExists) throw LobbyMessage.ALREADY_OWNS_LOBBY;

  const response = await bfetch('/lobby', {
    method: 'post',
    body: { code },
    machine: machine,
  });

  if (response.message !== 'JOINED') throw LobbyMessage[response.message];

  const createdLobby = await db<
    Lobby[]
  >`INSERT INTO lobby (code, is_active, owner_id, machine_id) VALUES (${code}, true, ${ownerId}, ${machine?.id ?? null}) RETURNING *`;
  return createdLobby[0];
}

async function leave(lobby: Lobby) {
  const machine = await repo.machine.getById(lobby.machine_id);
  if (!machine) throw LobbyMessage.NO_AVAILABLE_MACHINE;

  const response = await bfetch('/lobby', {
    method: 'delete',
    machine,
  });

  if (response.message !== 'LEFT') throw LobbyMessage[response.message];

  const updatedLobby = await db<Lobby[]>`UPDATE lobby SET is_active = false WHERE is_active = true AND id = ${lobby.id} RETURNING *`;
  if (updatedLobby.length === 0) throw LobbyMessage.LOBBY_NOT_FOUND;

  return updatedLobby[0];
}

async function ready(lobby: Lobby) {
  const machine = await repo.machine.getById(lobby.machine_id);
  if (!machine) throw LobbyMessage.NO_AVAILABLE_MACHINE;

  const response = await bfetch('/lobby/ready', {
    method: 'post',
    machine,
  });

  if (response.message !== 'READY') throw LobbyMessage[response.message];
}

async function getById(id: number): Promise<Lobby | null> {
  const lobby = await db<Lobby[]>`SELECT * FROM lobby WHERE id = ${id}`;

  return lobby?.[0] ?? null;
}

async function getByOwnerId(ownerId: number): Promise<Lobby | null> {
  const lobby = await db<Lobby[]>`SELECT * FROM lobby WHERE owner_id = ${ownerId} AND is_active = true`;

  return lobby?.[0] ?? null;
}

async function getByDiscordId(discordId: string): Promise<Lobby | null> {
  const lobby = await db<Lobby[]>`
    SELECT lobby.*
    FROM lobby
    JOIN player ON lobby.owner_id = player.id
    WHERE player.discord_id = ${discordId} AND lobby.is_active = true
  `;

  return lobby?.[0] ?? null;
}

export const lobby = {
  join,
  leave,
  ready,
  resetActive,
  getById,
  getByOwnerId,
  getByDiscordId,
};
