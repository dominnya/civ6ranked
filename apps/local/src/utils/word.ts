import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import Ocr from '@gutenye/ocr-node';
import { mouse, screen, Point, Region, imageToJimp } from '@nut-tree-fork/nut-js';

import { config } from '~/config';

// nut.js settings
screen.config.resourceDirectory = __dirname;
screen.config.autoHighlight = false;
mouse.config.mouseSpeed = 2000;

type OcrTextLine = { text: string; mean?: number; box?: number[][] };
type OcrWord = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

const ocrPromise = Ocr.create();

const toBoundingBox = (line: OcrTextLine) => {
  if (!line.box?.length) return undefined;
  const xs = line.box.map(point => point[0]);
  const ys = line.box.map(point => point[1]);
  if (!xs.length || !ys.length) return undefined;
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
};

const normalizeOcrResult = (result: OcrTextLine[]): OcrWord[] =>
  result
    .filter(line => line.text?.trim())
    .map(line => ({ text: line.text.trim(), bbox: toBoundingBox(line) }))
    .filter((line): line is OcrWord => Boolean(line.bbox));

const findWord = async (targetWord: string, region?: Region): Promise<{ word: OcrWord | undefined; captureRegion: Region }> => {
  const ocr = await ocrPromise;
  const captureRegion: Region = region ?? new Region(0, 0, config.screenWidth, config.screenHeight);

  const img = await screen.grabRegion(captureRegion);
  const imageBuffer = await imageToJimp(img).getBufferAsync('image/png');
  const tempFilePath = join(tmpdir(), `ocr-${randomUUID()}.png`);

  await Bun.write(tempFilePath, imageBuffer);

  let result: OcrTextLine[] = [];
  try {
    result = (await ocr.detect(tempFilePath)) as OcrTextLine[];
  } finally {
    await unlink(tempFilePath).catch(() => undefined);
  }

  const words = normalizeOcrResult(result);
  const normalizeMatchText = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  const target = normalizeMatchText(targetWord);
  const word = words.find(w => normalizeMatchText(w.text).includes(target));

  return { word, captureRegion };
};

export function word(targetWord: string, region?: Region) {
  let foundWord = findWord(targetWord, region);

  return {
    get exists(): Promise<boolean> {
      return foundWord.then(result => Boolean(result.word));
    },
    find() {
      foundWord = findWord(targetWord, region);
    },
    async point(): Promise<Point | undefined> {
      const result = await foundWord;
      if (!result.word) return undefined;

      const { x0, y0, x1, y1 } = result.word.bbox;
      return new Point(result.captureRegion.left + x0 + (x1 - x0) / 2, result.captureRegion.top + y0 + (y1 - y0) / 2);
    },
    async click(): Promise<boolean> {
      const result = await foundWord;
      if (!result.word) return false;

      const { x0, y0, x1, y1 } = result.word.bbox;
      const clickX = result.captureRegion.left + x0 + (x1 - x0) / 2;
      const clickY = result.captureRegion.top + y0 + (y1 - y0) / 2;

      await mouse.setPosition(new Point(clickX, clickY));
      await mouse.leftClick();
      await mouse.setPosition(new Point(config.screenWidth, config.screenHeight));
      return true;
    },
  };
}
