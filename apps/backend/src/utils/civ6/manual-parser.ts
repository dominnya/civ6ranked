import { Buffer } from 'buffer';

import { readState, parseEntry } from '~/utils/civ6/binary-reader';
import { ACTOR_DATA, START_ACTOR } from '~/utils/civ6/constants';

import type { State, Entry } from '~/utils/civ6/binary-reader';
import type { ParsedCiv } from '~/utils/civ6/types';

interface ActorContext {
  readonly curr: Record<string, Entry> | undefined;
  readonly civs: readonly ParsedCiv[];
}

interface MarkerMatch {
  readonly pos: number;
  readonly label: string;
  readonly marker: Buffer;
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Finds all occurrences of a pattern in a string using regex. */
function findAllOccurrences(str: string, pattern: Buffer, label: string): MarkerMatch[] {
  const patStr = pattern.toString('latin1');
  const regex = new RegExp(escapeRegex(patStr), 'g');

  return Array.from(str.matchAll(regex)).map(m => ({
    pos: m.index!,
    label,
    marker: pattern,
  }));
}

/** Updates the actor record with new entry info. */
function updateActor(actor: Record<string, Entry>, info: Entry): Record<string, Entry> {
  const next = { ...actor };
  if (info.marker.equals(START_ACTOR)) next['START_ACTOR'] = info;

  const keys = Object.keys(ACTOR_DATA) as (keyof typeof ACTOR_DATA)[];
  const key = keys.find(k => info.marker.equals(ACTOR_DATA[k]));

  // If we already have a value for this key in the current block, don't overwrite it.
  // This prevents issues where multiple names appear in a single block (e.g. history).
  if (key && !next[key]) {
    next[key] = info;
  }

  return next;
}

/** Extracts civilization data from an actor record. */
function extractCiv(actor: Record<string, Entry>): ParsedCiv | undefined {
  const get = (k: string) => actor[k]?.data;

  const typeStr = get('ACTOR_TYPE') as string | undefined;
  const isFullCiv = typeStr && (typeStr.includes('CIVILIZATION_LEVEL_FULL_CIV') || typeStr.includes('CIVILIZATION_LEVEL_CITY_STATE'));
  const hasName = !!actor.ACTOR_NAME;

  if (isFullCiv && hasName) {
    const isCityState = typeStr?.includes('CIVILIZATION_LEVEL_CITY_STATE');
    const pName = get('PLAYER_NAME') as string | undefined;
    const playerName = isCityState ? undefined : pName;

    return {
      actorName: get('ACTOR_NAME') as string,
      leaderName: get('LEADER_NAME') as string,
      playerName,
      isHuman: (get('ACTOR_AI_HUMAN') as number) === 3,
      isAlive: get('PLAYER_ALIVE') as boolean,
    };
  }
  return undefined;
}

/** Processes a single scanner candidate match. */
function processCandidate(ctx: ActorContext, candidate: MarkerMatch, buffer: Buffer, state: State): ActorContext {
  state.pos = candidate.pos;
  readState(buffer, state);

  try {
    const entry = parseEntry(buffer, state, true);
    const isStart = entry.marker.equals(START_ACTOR);

    const civToPush = isStart && ctx.curr ? extractCiv(ctx.curr) : undefined;
    const nextCivs = civToPush ? [...ctx.civs, civToPush] : ctx.civs;

    const nextCurrBase = isStart ? {} : ctx.curr;
    const nextCurr = nextCurrBase ? updateActor(nextCurrBase, entry) : undefined;

    return { ...ctx, civs: nextCivs, curr: nextCurr };
  } catch {
    return ctx;
  }
}

/** Collects all interesting markers from the buffer. */
function collectCandidates(buffer: Buffer): MarkerMatch[] {
  const str = buffer.toString('latin1');
  return [
    ...findAllOccurrences(str, START_ACTOR, 'START_ACTOR'),
    ...Object.entries(ACTOR_DATA).flatMap(([key, val]) => findAllOccurrences(str, val, key)),
  ].sort((a, b) => a.pos - b.pos);
}

/** Main scanner loop. */
function runScannerLoop(buffer: Buffer, state: State): ActorContext {
  const candidates = collectCandidates(buffer);
  const initialCtx: ActorContext = { curr: undefined, civs: [] };

  return candidates.reduce((ctx, candidate) => {
    return processCandidate(ctx, candidate, buffer, state);
  }, initialCtx);
}

/** Finds the start of the relevant data block. */
function findStart(buffer: Buffer): number {
  const magic = Buffer.from([0x99, 0xb0, 0xd9, 0x05]);
  const idx = buffer.indexOf(magic);
  return idx !== -1 ? idx : 0;
}

/** Parses civilization data manually from a save buffer. */
export function parseManualCivs(buffer: Buffer): {
  civs: ParsedCiv[];
} {
  if (buffer.subarray(0, 4).toString() !== 'CIV6') {
    throw new Error('Not a Civilization 6 save file');
  }

  const start = findStart(buffer);
  const state: State = { pos: start, next4: buffer.subarray(start, start + 4) };

  const result = runScannerLoop(buffer, state);
  const lastCiv = result.curr ? extractCiv(result.curr) : undefined;
  const civs = lastCiv ? [...result.civs, lastCiv] : result.civs;

  return { civs: civs as ParsedCiv[] };
}
