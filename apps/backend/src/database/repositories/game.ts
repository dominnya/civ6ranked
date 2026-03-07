import { join } from 'path';

import { randomUUIDv7 } from 'bun';

import { config } from '~/config';
import { db } from '~/database';
import { machine as repoMachine } from '~/database/repositories/machine';
import { player as repoPlayer, type Player } from '~/database/repositories/player';
import { GameMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';
import { createParser } from '~/utils/civ6';
import { createEloPipeline } from '~/utils/ranking';

import type { Lobby } from '~/database/repositories/lobby';
import type { PlayerRR as RankingPlayerRR } from '~/utils/ranking/types';

export interface PlayerRR extends RankingPlayerRR {
  discord_id: string | null;
  place: number;
}

export interface MatchUrls {
  savePath: string;
  statsPath: string;
  stats2Path: string;
}

async function calculateMatchResult(archiveData: Blob | ArrayBuffer | Buffer) {
  const archiveId = randomUUIDv7();

  const archiveDir = join('public/archives', archiveId);
  const paths = {
    savePath: join(archiveDir, 'latest.Civ6Save'),
    statsPath: join(archiveDir, 'Player_Stats.csv'),
    stats2Path: join(archiveDir, 'Player_Stats_2.csv'),
  };

  // Archive URLs for transparency
  const urls: Record<string, string> = Object.entries(paths).reduce(
    (acc, [key, path]) => {
      acc[key] = `${config.ownUrl}/archives/${archiveId}/${path.replace(/\\/g, '/').split('/').pop()}`;
      return acc;
    },
    {} as Record<string, string>
  );

  const archive = new Bun.Archive(archiveData);
  await archive.extract(archiveDir);

  const { civs, players, getMaxTurn } = createParser(paths);

  // playerName is the same as ingameId
  const onlineCivs = civs().filter(p => !!p.playerName && p.playerName !== config.spectatorId);
  const playerNames = onlineCivs.map(p => p.playerName) as string[];
  const onlinePlayers = players().filter(p => playerNames.includes(p.player));

  const elos = await repoPlayer.getElosByIngameId(playerNames);
  const formattedElos = repoPlayer.elosToPlayerElos(elos);

  const histories = await repoPlayer.histories(playerNames, 1, 10);
  const streak = repoPlayer.historiesToStreak(histories);

  const { results } = createEloPipeline(onlinePlayers, formattedElos, streak);

  return { results, civs: onlineCivs, players: onlinePlayers, getMaxTurn, urls };
}

async function createMatchResults(matchId: number, elo: Awaited<ReturnType<typeof calculateMatchResult>>): Promise<void> {
  return db.transaction(async trx => {
    await trx`UPDATE match SET save_url = ${elo.urls.savePath}, stats_url = ${elo.urls.statsPath}, stats2_url = ${elo.urls.stats2Path}, max_turn = ${elo.getMaxTurn()} WHERE id = ${matchId}`;

    const playerCivs = elo.civs,
      playerStats = elo.players,
      playerResults = elo.results();

    // Only save results if at least 4 valid players were found in the logs to prevent RR manipulation in smaller matches.
    if (process.env.npm_lifecycle_event !== 'dev' && playerCivs.filter(c => !!c.playerName).length < 4) return;

    let place = 0;
    for (const result of playerResults) {
      place++;
      const player = await trx<Player[]>`SELECT id FROM player WHERE ingame_id = ${result.ingameId} LIMIT 1`;
      if (player.length === 0) continue;

      const stats = playerStats.find(c => c.player === result.ingameId);

      const row = {
        match_id: matchId,
        player_id: player[0].id,
        place: place,
        rr: result.rr,

        num_cities: stats?.numCities,
        population: stats?.population,
        technologies: stats?.technologies,
        civics: stats?.civics,

        land_units: stats?.landUnits,
        land_corps: stats?.landCorps,
        land_armies: stats?.landArmies,
        naval_units: stats?.navalUnits,

        tiles_owned: stats?.tilesOwned,
        tiles_improved: stats?.tilesImproved,
        gold_balance: stats?.goldBalance,
        faith_balance: stats?.faithBalance,
        science_yield: stats?.scienceYield,
        culture_yield: stats?.cultureYield,
        gold_yield: stats?.goldYield,
        faith_yield: stats?.faithYield,
        production_yield: stats?.productionYield,
        food_yield: stats?.foodYield,

        score_tiles: stats?.scoreTiles,
        score_buildings: stats?.scoreBuildings,
        score_districts: stats?.scoreDistricts,
        score_population: stats?.scorePopulation,
        outgoing_trade_routes: stats?.outgoingTradeRoutes,
        tourism: stats?.tourism,
        diplo_victory_points: stats?.diploVictoryPoints,
        favor_balance: stats?.favorBalance,
        favor_lifetime: stats?.favorLifetime,
        co2_per_turn: stats?.co2PerTurn,
      };

      await trx`
        INSERT INTO match_result (
          match_id, player_id, place, rr, 
          num_cities, population, technologies, civics, 
          land_units, land_corps, land_armies, naval_units, 
          tiles_owned, tiles_improved, 
          gold_balance, faith_balance, 
          science_yield, culture_yield, gold_yield, faith_yield, production_yield, food_yield, 
          score_tiles, score_buildings, score_districts, score_population, 
          outgoing_trade_routes, tourism, diplo_victory_points, 
          favor_balance, favor_lifetime, co2_per_turn
        ) VALUES (
          ${row.match_id}, ${row.player_id}, ${row.place}, ${row.rr}, 
          ${row.num_cities}, ${row.population}, ${row.technologies}, ${row.civics}, 
          ${row.land_units}, ${row.land_corps}, ${row.land_armies}, ${row.naval_units}, 
          ${row.tiles_owned}, ${row.tiles_improved}, 
          ${row.gold_balance}, ${row.faith_balance}, 
          ${row.science_yield}, ${row.culture_yield}, ${row.gold_yield}, ${row.faith_yield}, ${row.production_yield}, ${row.food_yield}, 
          ${row.score_tiles}, ${row.score_buildings}, ${row.score_districts}, ${row.score_population}, 
          ${row.outgoing_trade_routes}, ${row.tourism}, ${row.diplo_victory_points}, 
          ${row.favor_balance}, ${row.favor_lifetime}, ${row.co2_per_turn}
        )
      `;

      await trx`UPDATE player SET elo = ${result.elo}, is_calibrating = false WHERE id = ${player[0].id}`;
    }
  });
}

async function createEmpty(): Promise<{ match_id: number }> {
  const result = await db<{ id: number }[]>`
    INSERT INTO match (created_at) VALUES (NOW()) RETURNING id
  `;

  return { match_id: result[0].id };
}

async function getTurn(matchId: number): Promise<number> {
  const result = await db<{ max_turn: number }[]>`
    SELECT max_turn FROM match WHERE id = ${matchId} LIMIT 1
  `;

  if (result.length === 0) return 0;
  return result[0].max_turn;
}

async function getResults(matchId: number): Promise<PlayerRR[]> {
  const results = await db<PlayerRR[]>`
    SELECT p.ingame_id, p.discord_id, mr.rr, p.elo, mr.place
    FROM match_result mr
    JOIN player p ON mr.player_id = p.id
    WHERE mr.match_id = ${matchId}
    ORDER BY mr.place ASC
  `;
  return results;
}

async function getMatchUrls(matchId: number): Promise<MatchUrls | null> {
  const result = await db<MatchUrls[]>`
    SELECT save_url, stats_url, stats2_url
    FROM match
    WHERE id = ${matchId}
    LIMIT 1
  `;

  if (result.length === 0) return null;
  return result[0];
}

async function finish(lobby: Lobby) {
  const machine = await repoMachine.getById(lobby.machine_id);
  if (!machine) throw GameMessage.NO_AVAILABLE_MACHINE;

  const response = await bfetch('/game', {
    method: 'delete',
    machine,
  });

  if (response.message !== 'LEFT') throw response.message;

  const match = await createEmpty();
  await db`UPDATE lobby SET is_active = false, match_id = ${match.match_id} WHERE id = ${lobby.id}`;

  const logs = await bfetch('/game/logs', {
    method: 'get',
    machine,
    rawResponse: true,
  });

  // .tar.gz file containing the logs
  const blob = await logs.blob();

  try {
    const matchResult = await calculateMatchResult(blob);

    await createMatchResults(match.match_id, matchResult);

    return { id: lobby.id, match_id: match.match_id, finished_at: new Date().toISOString() };
  } catch (error) {
    console.error(error);
    throw GameMessage.UNKNOWN_SAVE_ERROR;
  }
}

export const game = {
  finish,
  calculateMatchResult,
  createMatchResults,
  createEmpty,
  getTurn,
  getResults,
  getMatchUrls,
};
