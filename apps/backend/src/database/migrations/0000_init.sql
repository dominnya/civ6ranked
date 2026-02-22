CREATE TABLE match (
  id              SERIAL PRIMARY KEY,
  map_size        TEXT,
  map_type        TEXT,
  dlc_list        TEXT[],
  mod_list        TEXT[] NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE player (
  id              SERIAL PRIMARY KEY,
  ingame_id       TEXT UNIQUE,
  discord_id      TEXT UNIQUE NOT NULL,
  elo             INTEGER NOT NULL,
  is_calibrating  BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lobby (
  id              SERIAL PRIMARY KEY,
  match_id        INTEGER,
  owner_id        INTEGER NOT NULL,
  code            TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (match_id) REFERENCES match(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES player(id) ON DELETE CASCADE
);

CREATE TABLE match_result (
  id              SERIAL PRIMARY KEY,
  match_id        INTEGER NOT NULL,
  player_id       INTEGER NOT NULL,
  place           INTEGER NOT NULL,
  elo             INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (match_id) REFERENCES match(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES player(id) ON DELETE CASCADE,
  UNIQUE (match_id, player_id)
);

CREATE INDEX idx_lobby_match_id ON lobby(match_id);
CREATE INDEX idx_match_result_match_id ON match_result(match_id);
CREATE INDEX idx_match_result_player_id ON match_result(player_id);