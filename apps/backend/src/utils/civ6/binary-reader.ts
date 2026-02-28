import { Buffer } from 'buffer';

import { COMPRESSED_DATA_END, DATA_TYPES } from '~/utils/civ6/constants';

/**
 * Represents the current reading state in the buffer.
 */
export interface State {
  /** Current byte position in the buffer */
  pos: number;
  /** The next 4 bytes at the current position (marker) */
  next4: Buffer;
  /** Flag indicating if compressed data reading has started */
  readCompressedData?: boolean;
}

/**
 * Represents a parsed data entry from the save file.
 */
export interface Entry {
  /** 4-byte marker identifier */
  marker: Buffer;
  /** Data type identifier */
  type: number;
  /** The parsed value (number, string, boolean, etc.) */
  data: unknown;
}

/**
 * Updates the state with the next 4 bytes from the buffer.
 */
export function readState(buffer: Buffer, state?: State | null): State | null {
  if (!state) return { pos: 0, next4: buffer.subarray(0, 4) };
  if (state.pos >= buffer.length - 4) return null;
  state.next4 = buffer.subarray(state.pos, state.pos + 4);
  return state;
}

function readBoolean(b: Buffer, s: State): boolean {
  s.pos += 8;
  const r = !!b[s.pos];
  s.pos += 4;
  return r;
}

function readInteger(b: Buffer, s: State): number {
  s.pos += 8;
  const r = b.readUInt32LE(s.pos);
  s.pos += 4;
  return r;
}

function readString(b: Buffer, s: State): string {
  const len = Buffer.concat([b.subarray(s.pos, s.pos + 3), Buffer.from([0])]).readUInt32LE(0);
  s.pos += 2;
  const info = b.subarray(s.pos, s.pos + 6);

  if (info[1] === 0 || info[1] === 0x20) {
    s.pos += 10;
    return '';
  }

  if (info[1] === 0x21) {
    s.pos += 6;
    const term = b.indexOf(0, s.pos) - s.pos;
    const r = b.subarray(s.pos, s.pos + term).toString();
    s.pos += len;
    return r;
  }
  return '';
}

function readUtfString(b: Buffer, s: State): string {
  const len = b.readUInt16LE(s.pos) * 2;
  s.pos += 8;
  if (s.pos + len <= b.length && len >= 2) {
    const r = b.subarray(s.pos, s.pos + len - 2).toString('utf16le');
    s.pos += len;
    return r;
  }
  return '';
}

const READERS: Record<number, (b: Buffer, s: State) => unknown> = {
  [DATA_TYPES.BOOLEAN]: readBoolean,
  [DATA_TYPES.INTEGER]: readInteger,
  [DATA_TYPES.STRING]: readString,
  [DATA_TYPES.UTF_STRING]: readUtfString,
};

/**
 * Handles the transition to reading a compressed data block.
 */
function handleCompressed(buffer: Buffer, state: State, result: Entry): Entry {
  state.pos = buffer.indexOf(COMPRESSED_DATA_END, state.pos) + 4;
  state.readCompressedData = true;
  return { ...result, data: 'UNKNOWN COMPRESSED DATA' };
}

function getEntry(buffer: Buffer, state: State): Entry {
  const typeBuf = buffer.subarray(state.pos + 4, state.pos + 8);
  const result: Entry = {
    marker: state.next4,
    type: typeBuf.readUInt32LE(),
    data: undefined,
  };
  state.pos += 8;
  return result;
}

function parseEntryInternal(buffer: Buffer, state: State, dontSkip: boolean, retry: boolean): Entry {
  const result = getEntry(buffer, state);

  if (!dontSkip && (result.marker.readUInt32LE() < 256 || result.type === 0)) {
    return { ...result, data: 'SKIP' };
  }

  if (result.type === 0x18 || buffer.subarray(state.pos - 4, state.pos - 2).equals(Buffer.from([0x78, 0x9c]))) {
    return handleCompressed(buffer, state, result);
  }

  const reader = READERS[result.type];
  if (reader) return { ...result, data: reader(buffer, state) };

  if (!retry) {
    state.pos -= 7;
    return parseEntryInternal(buffer, state, dontSkip, true);
  }

  return result;
}

/**
 * Parses the next entry from the buffer based on the current state.
 * Handles type detection, skipping, and retries for misaligned reads.
 */
export function parseEntry(buffer: Buffer, state: State, dontSkip?: boolean): Entry {
  return parseEntryInternal(buffer, state, !!dontSkip, false);
}
