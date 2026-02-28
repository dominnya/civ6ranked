import { readFileSync } from 'fs';

import type { PlayerStats } from '~/utils/civ6/types';

interface StatsIndices1 {
  turn: number;
  player: number;
  cities: number;
  population: number;
  technologies: number;
  civics: number;
  landUnits: number;
  landCorps: number;
  landArmies: number;
  navalUnits: number;
  tilesOwned: number;
  tilesImproved: number;
  goldBalance: number;
  faithBalance: number;
  scienceYield: number;
  cultureYield: number;
  goldYield: number;
  faithYield: number;
  productionYield: number;
  foodYield: number;
}

interface StatsIndices2 {
  turn: number;
  player: number;
  scoreTiles: number;
  scoreBuildings: number;
  scoreDistricts: number;
  scorePopulation: number;
  outgoingTradeRoutes: number;
  tourism: number;
  diploVictoryPoints: number;
  favorBalance: number;
  favorLifetime: number;
  co2PerTurn: number;
}

export function loadPlayerStats(paths: string[]): Map<string, PlayerStats> {
  const map = new Map<string, PlayerStats>();
  paths.forEach(p => processFile(p, map));
  return map;
}

function processFile(path: string, map: Map<string, PlayerStats>): void {
  try {
    const content = readFileSync(path, 'utf-8');

    if (path.endsWith('Player_Stats.csv')) return parseFile1(content, map);
    if (path.endsWith('Player_Stats_2.csv')) return parseFile2(content, map);
  } catch {
    // Ignore errors
  }
}

function parseFile1(raw: string, map: Map<string, PlayerStats>): void {
  const lines = parseCsvLines(raw);
  if (lines.length < 2) return;
  const idx = getIndices1(lines[0]!);
  lines.slice(1).forEach(row => updateStats1(row, idx, map));
}

function updateStats1(row: string[], idx: StatsIndices1, map: Map<string, PlayerStats>): void {
  const player = row[idx.player];
  if (!player) return;
  const turn = toNumber(row[idx.turn]) ?? 0;
  const existing = map.get(player);

  if (!existing || turn >= existing.turn) {
    map.set(player, createStats1(row, idx, turn, player, existing));
  }
}

function createStats1(row: string[], idx: StatsIndices1, turn: number, player: string, existing?: PlayerStats): PlayerStats {
  return {
    ...(existing || { turn: 0, player }),
    turn,
    player,
    numCities: toNumber(row[idx.cities]),
    population: toNumber(row[idx.population]),
    technologies: toNumber(row[idx.technologies]),
    civics: toNumber(row[idx.civics]),
    landUnits: toNumber(row[idx.landUnits]),
    landCorps: toNumber(row[idx.landCorps]),
    landArmies: toNumber(row[idx.landArmies]),
    navalUnits: toNumber(row[idx.navalUnits]),
    tilesOwned: toNumber(row[idx.tilesOwned]),
    tilesImproved: toNumber(row[idx.tilesImproved]),
    goldBalance: toNumber(row[idx.goldBalance]),
    faithBalance: toNumber(row[idx.faithBalance]),
    scienceYield: toNumber(row[idx.scienceYield]),
    cultureYield: toNumber(row[idx.cultureYield]),
    goldYield: toNumber(row[idx.goldYield]),
    faithYield: toNumber(row[idx.faithYield]),
    productionYield: toNumber(row[idx.productionYield]),
    foodYield: toNumber(row[idx.foodYield]),
  };
}

function parseFile2(raw: string, map: Map<string, PlayerStats>): void {
  const lines = parseCsvLines(raw);
  if (lines.length < 2) return;
  const idx = getIndices2(lines[0]!);
  lines.slice(1).forEach(row => updateStats2(row, idx, map));
}

function updateStats2(row: string[], idx: StatsIndices2, map: Map<string, PlayerStats>): void {
  const player = row[idx.player];
  if (!player) return;
  const turn = toNumber(row[idx.turn]) ?? 0;
  const existing = map.get(player);

  if (existing && turn === existing.turn) {
    Object.assign(existing, extractStats2(row, idx));
  } else if (!existing) {
    map.set(player, { ...extractStats2(row, idx), turn, player });
  }
}

function extractStats2(row: string[], idx: StatsIndices2) {
  return {
    scoreTiles: toNumber(row[idx.scoreTiles]),
    scoreBuildings: toNumber(row[idx.scoreBuildings]),
    scoreDistricts: toNumber(row[idx.scoreDistricts]),
    scorePopulation: toNumber(row[idx.scorePopulation]),
    outgoingTradeRoutes: toNumber(row[idx.outgoingTradeRoutes]),
    tourism: toNumber(row[idx.tourism]),
    diploVictoryPoints: toNumber(row[idx.diploVictoryPoints]),
    favorBalance: toNumber(row[idx.favorBalance]),
    favorLifetime: toNumber(row[idx.favorLifetime]),
    co2PerTurn: toNumber(row[idx.co2PerTurn]),
  };
}

function parseCsvLines(raw: string): string[][] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(l => l.split(',').map(v => v.trim()));
}

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function getIndices1(header: string[]): StatsIndices1 {
  return {
    turn: header.indexOf('Game Turn'),
    player: header.indexOf('Player'),
    cities: header.indexOf('Num Cities'),
    population: header.indexOf('Population'),
    technologies: header.indexOf('Techs'),
    civics: header.indexOf('Civics'),
    landUnits: header.indexOf('Land Units'),
    landCorps: header.indexOf('corps'),
    landArmies: header.indexOf('Armies'),
    navalUnits: header.indexOf('Naval Units'),
    tilesOwned: header.indexOf('TILES: Owned'),
    tilesImproved: header.indexOf('Improved'),
    goldBalance: header.indexOf('BALANCE: Gold'),
    faithBalance: header.indexOf('Faith'),
    scienceYield: header.indexOf('YIELDS: Science'),
    cultureYield: header.indexOf('Culture'),
    goldYield: header.indexOf('Gold'),
    faithYield: header.lastIndexOf('Faith'),
    productionYield: header.indexOf('Production'),
    foodYield: header.indexOf('Food'),
  };
}

function getIndices2(header: string[]): StatsIndices2 {
  return {
    turn: header.indexOf('Game Turn'),
    player: header.indexOf('Player'),
    scoreTiles: header.indexOf('BY TYPE: Tiles'),
    scoreBuildings: header.indexOf('Buildings'),
    scoreDistricts: header.indexOf('Districts'),
    scorePopulation: header.indexOf('Population'),
    outgoingTradeRoutes: header.indexOf('Outgoing Trade Routes'),
    tourism: header.indexOf('TOURISM'),
    diploVictoryPoints: header.indexOf('Diplo Victory'),
    favorBalance: header.indexOf('BALANCE: Favor'),
    favorLifetime: header.indexOf('LIFETIME: Favor'),
    co2PerTurn: header.indexOf('CO2 Per Turn'),
  };
}
