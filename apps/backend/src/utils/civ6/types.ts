export interface ParsedCiv {
  actorName?: string;
  leaderName?: string;
  playerName?: string;
  isHuman?: boolean;
  isAlive?: boolean;
}

export interface ParserOptions {
  savePath: string;
  statsPath: string;
  stats2Path: string;
}

/** Raw game telemetry snapshot provided at match conclusion. */
export interface PlayerStats {
  turn: number;
  player: string;

  // From Player_Stats.csv
  numCities?: number;
  population?: number;
  technologies?: number;
  civics?: number;
  landUnits?: number;
  landCorps?: number;
  landArmies?: number;
  navalUnits?: number;
  tilesOwned?: number;
  tilesImproved?: number;
  goldBalance?: number;
  faithBalance?: number;
  scienceYield?: number;
  cultureYield?: number;
  goldYield?: number;
  faithYield?: number;
  productionYield?: number;
  foodYield?: number;

  // From Player_Stats_2.csv
  scoreTiles?: number;
  scoreBuildings?: number;
  scoreDistricts?: number;
  scorePopulation?: number;
  outgoingTradeRoutes?: number;
  tourism?: number;
  diploVictoryPoints?: number;
  favorBalance?: number;
  favorLifetime?: number;
  co2PerTurn?: number;
}
