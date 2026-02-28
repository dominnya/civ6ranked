import { db } from '~/database';
import { PlayerMessage } from '~/types/response';

import type { PlayerHistory as RankingPlayerHistory, PlayerElo as RankingPlayerElo } from '~/utils/ranking/types';

export interface Player {
  id: number;
  ingame_id: string | null;
  discord_id: string;
  elo: number;
  is_calibrating: boolean;
  created_at: string;
}

export interface PlayerHistory {
  id: number;
  match_id: number;
  player_id: number;
  place: number;
  rr: number;
  created_at: string;
  finished_at: string;
}

export interface PlayerHistories {
  [ingameId: string]: (PlayerHistory & { ingame_id: string })[];
}

export interface PlayerElo {
  ingame_id: string;
  elo: number;
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

async function history(discordId: string, page: number, limit: number = 10): Promise<PlayerHistory[]> {
  const offset = (page - 1) * limit;

  const history = await db<PlayerHistory[]>`
    SELECT mr.*, m.created_at AS finished_at
    FROM match_result mr
    JOIN player p ON mr.player_id = p.id
    JOIN match m ON mr.match_id = m.id
    WHERE p.discord_id = ${discordId}
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return history;
}

async function histories(ingameIds: string[], page: number, limit: number = 10): Promise<PlayerHistories> {
  if (!ingameIds.length) return {};

  const offset = (page - 1) * limit;

  const rows = await db<PlayerHistories[string]>`
    SELECT *
    FROM (
      SELECT
        mr.*,
        p.ingame_id,
        m.created_at AS finished_at,
        ROW_NUMBER() OVER (
          PARTITION BY p.ingame_id
          ORDER BY m.created_at DESC
        ) AS rn
      FROM match_result mr
      JOIN player p ON mr.player_id = p.id
      JOIN match m ON mr.match_id = m.id
      WHERE p.ingame_id IN (${ingameIds})
    ) ranked
    WHERE rn > ${offset}
      AND rn <= ${offset + limit}
    ORDER BY ingame_id, finished_at DESC
  `;

  const grouped: PlayerHistories = {};

  for (const row of rows) {
    const { ingame_id, ...history } = row;

    if (!grouped[ingame_id]) {
      grouped[ingame_id] = [];
    }

    grouped[ingame_id].push({
      ...history,
      ingame_id,
    });
  }

  return grouped;
}

function historiesToStreak(histories: PlayerHistories): RankingPlayerHistory[] {
  return Object.entries(histories).flatMap(([ingameId, matches]): RankingPlayerHistory[] =>
    matches
      .slice()
      .sort((a, b) => new Date(a.finished_at).getTime() - new Date(b.finished_at).getTime())
      .map<Pick<RankingPlayerHistory, 'ingameId' | 'type'>>(match => ({
        ingameId,
        type: match.rr > 0 ? 'W' : 'L',
      }))
      .reduce<RankingPlayerHistory[]>((acc, curr) => {
        const prev = acc.at(-1);
        const streak = prev && prev.type === curr.type ? prev.streak + 1 : 1;

        return [...acc, { ...curr, streak }];
      }, [])
  );
}

async function link(discordId: string, ingameId: string) {
  const ingameLinked = await db<{ discord_id: string }[]>`
    SELECT discord_id FROM player WHERE ingame_id = ${ingameId} LIMIT 1
  `;

  if (ingameLinked.length > 0) throw PlayerMessage.INGAME_ID_ALREADY_LINKED;

  const player = await db<Player[]>`
    UPDATE player SET ingame_id = ${ingameId} WHERE discord_id = ${discordId} RETURNING *
  `;

  return player[0];
}

async function getElosByIngameId(ingameId: string[]): Promise<PlayerElo[]> {
  const elos = await db<PlayerElo[]>`SELECT ingame_id, elo FROM player WHERE ingame_id = ANY(${db.array(ingameId, 'TEXT')})`;
  return elos;
}

// snake_case to camelCase
function elosToPlayerElos(elos: PlayerElo[]): RankingPlayerElo[] {
  return elos.map(elo => ({
    ingameId: elo.ingame_id,
    elo: elo.elo,
  }));
}

export const player = {
  profile,
  create,
  history,
  histories,
  historiesToStreak,
  link,
  getElosByIngameId,
  elosToPlayerElos,
};
