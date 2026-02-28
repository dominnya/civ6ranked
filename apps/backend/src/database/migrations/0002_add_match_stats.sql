ALTER TABLE player
ALTER COLUMN elo SET DEFAULT 500,
ALTER COLUMN is_calibrating SET DEFAULT false;

ALTER TABLE match
ADD COLUMN save_url TEXT,
ADD COLUMN stats_url TEXT,
ADD COLUMN stats2_url TEXT,
ADD COLUMN max_turn TEXT,
ALTER COLUMN mod_list SET DEFAULT '{}';

ALTER TABLE match_result 
RENAME COLUMN elo TO rr;

ALTER TABLE match_result
-- From Player_Stats.csv
ADD COLUMN num_cities INTEGER,
ADD COLUMN population INTEGER,
ADD COLUMN technologies INTEGER,
ADD COLUMN civics INTEGER,
ADD COLUMN land_units INTEGER,
ADD COLUMN land_corps INTEGER,
ADD COLUMN land_armies INTEGER,
ADD COLUMN naval_units INTEGER,
ADD COLUMN tiles_owned INTEGER,
ADD COLUMN tiles_improved INTEGER,
ADD COLUMN gold_balance DOUBLE PRECISION,
ADD COLUMN faith_balance DOUBLE PRECISION,
ADD COLUMN science_yield DOUBLE PRECISION,
ADD COLUMN culture_yield DOUBLE PRECISION,
ADD COLUMN gold_yield DOUBLE PRECISION,
ADD COLUMN faith_yield DOUBLE PRECISION,
ADD COLUMN production_yield DOUBLE PRECISION,
ADD COLUMN food_yield DOUBLE PRECISION,
-- From Player_Stats_2.csv
ADD COLUMN score_tiles INTEGER,
ADD COLUMN score_buildings INTEGER,
ADD COLUMN score_districts INTEGER,
ADD COLUMN score_population INTEGER,
ADD COLUMN outgoing_trade_routes INTEGER,
ADD COLUMN tourism DOUBLE PRECISION,
ADD COLUMN diplo_victory_points INTEGER,
ADD COLUMN favor_balance INTEGER,
ADD COLUMN favor_lifetime INTEGER,
ADD COLUMN co2_per_turn DOUBLE PRECISION;