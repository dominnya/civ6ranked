export const START_ACTOR = Buffer.from([0x58, 0xba, 0x7f, 0x4c]);
export const END_UNCOMPRESSED = Buffer.from([0x00, 0x00, 0x01, 0x00]);
export const COMPRESSED_DATA_END = Buffer.from([0x00, 0x00, 0xff, 0xff]);

export const ACTOR_DATA = {
  ACTOR_NAME: Buffer.from([0x2f, 0x5c, 0x5e, 0x9d]),
  LEADER_NAME: Buffer.from([0x5f, 0x5e, 0xcd, 0xe8]),
  ACTOR_TYPE: Buffer.from([0xbe, 0xab, 0x55, 0xca]),
  PLAYER_NAME: Buffer.from([0xfd, 0x6b, 0xb9, 0xda]),
  PLAYER_ALIVE: Buffer.from([0xa6, 0xdf, 0xa7, 0x62]),
  ACTOR_AI_HUMAN: Buffer.from([0x95, 0xb9, 0x42, 0xce]),
  ACTOR_DESCRIPTION: Buffer.from([0x65, 0x19, 0x9b, 0xff]),
};

export const DATA_TYPES = {
  BOOLEAN: 1,
  INTEGER: 2,
  STRING: 5,
  UTF_STRING: 6,
  ARRAY_START: 0x0a,
};

export const KEYS_ASCII = {
  SCIENCE: Buffer.from("YIELD_SCIENCE"),
  CULTURE: Buffer.from("YIELD_CULTURE"),
  FAITH: Buffer.from("YIELD_FAITH"),
  GOLD: Buffer.from("YIELD_GOLD"),
  MILITARY: Buffer.from("MILITARY_STRENGTH"),
  SCORE: Buffer.from("SCORE"),
  DIPLOMATIC: Buffer.from("DIPLOMATIC_FAVOR"),
  TREASURY: Buffer.from("TREASURY"),
  TOTAL_FAITH: Buffer.from("TOTAL_FAITH"),
};

export const KEYS_UCS2 = {
  SCIENCE: Buffer.from("YIELD_SCIENCE", "utf16le"),
  CULTURE: Buffer.from("YIELD_CULTURE", "utf16le"),
  FAITH: Buffer.from("YIELD_FAITH", "utf16le"),
  GOLD: Buffer.from("YIELD_GOLD", "utf16le"),
  MILITARY: Buffer.from("MILITARY_STRENGTH", "utf16le"),
  SCORE: Buffer.from("SCORE", "utf16le"),
  DIPLOMATIC: Buffer.from("DIPLOMATIC_FAVOR", "utf16le"),
  TREASURY: Buffer.from("TREASURY", "utf16le"),
  TOTAL_FAITH: Buffer.from("TOTAL_FAITH", "utf16le"),
};

export const SEARCH_OFFSETS = [
  24, 28, 32, 36, 40, 44, 48, 52, 56, 60, -8, -12, -16, -20, -24, -28, -32, -36,
  -40, -44, -48, -52, -56, -60,
];

export const WIDE_OFFSETS = [
  ...SEARCH_OFFSETS,
  64,
  68,
  72,
  76,
  80,
  84,
  88,
  92,
  96,
  100,
  104,
  108,
  112,
  116,
  120,
  124,
  128,
  -64,
  -68,
  -72,
  -76,
  -80,
  -84,
  -88,
  -92,
  -96,
  -100,
  -104,
  -108,
  -112,
  -116,
  -120,
  -124,
  -128,
];
