import { readFileSync } from 'fs';

import { loadPlayerStats } from '~/utils/civ6/csv-parser';
import { parseManualCivs } from '~/utils/civ6/manual-parser';

import type { ParserOptions, ParsedCiv, PlayerStats } from '~/utils/civ6/types';

export function createParser(options: ParserOptions) {
  const { savePath, statsPath, stats2Path } = options;
  const buffer = readFileSync(savePath);

  const civs = () => parseManualCivs(buffer).civs;

  const players = () => {
    const statsMap = loadPlayerStats([statsPath, stats2Path]);
    const players = mapCivsToStats(civs(), statsMap);
    return players;
  };

  return { civs, players, getMaxTurn: () => Math.max(...players().map(p => p.turn)) };
}

function mapCivsToStats(civs: ParsedCiv[], stats: Map<string, PlayerStats>): PlayerStats[] {
  return civs.map(civ => {
    const stat = stats.get(civ.actorName || '') || createEmptyStats(civ);
    return { ...stat, player: civ.playerName || stat.player || 'Unknown' };
  });
}

function createEmptyStats(civ: ParsedCiv): PlayerStats {
  return {
    turn: 0,
    player: civ.playerName || 'Unknown',
  };
}
