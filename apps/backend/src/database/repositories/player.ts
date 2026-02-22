import { db } from '~/database';
import { PlayerMessage } from '~/types/response';

interface Player {
  id: number;
  ingame_id: string | null;
  discord_id: string;
  elo: number;
  is_calibrating: boolean;
  created_at: string;
}

async function create(discordId: string): Promise<Player> {
  const player = (await db`
    INSERT INTO player (discord_id, elo, is_calibrating) VALUES (${discordId}, 0, true) RETURNING *
  `) as Player[];

  return player[0];
}

async function profile(discordId: string): Promise<Player> {
  const player = (await db`
    SELECT * FROM player WHERE discord_id = ${discordId} LIMIT 1
  `) as Player[] | undefined;

  if (!player || player.length === 0) return create(discordId);
  return player[0];
}

async function history(discordId: string, page: number, limit: number = 10) {
  const offset = (page - 1) * limit;

  const history = (await db`
    SELECT mr.*, m.created_at AS finished_at
    FROM match_result mr
    JOIN player p ON mr.player_id = p.id
    JOIN match m ON mr.match_id = m.id
    WHERE p.discord_id = ${discordId}
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as {
    id: number;
    match_id: number;
    player_id: number;
    place: number;
    elo: number;
    created_at: string;
    finished_at: string;
  }[];

  return history;
}

async function link(discordId: string, ingameId: string) {
  const ingameLinked = (await db`
    SELECT discord_id FROM player WHERE ingame_id = ${ingameId} LIMIT 1
  `) as { discord_id: string }[];

  if (ingameLinked.length > 0) throw PlayerMessage.INGAME_ID_ALREADY_LINKED;

  const player = (await db`
    UPDATE player SET ingame_id = ${ingameId} WHERE discord_id = ${discordId} RETURNING *
  `) as (Omit<Player, 'ingame_id'> & { ingame_id: string })[];

  return player[0];
}

export const player = {
  profile,
  create,
  history,
  link,
};
