import { word } from '~/utils/word';

export async function isInGame() {
  const trackerWord = word('Observer');

  if (await trackerWord.exists) return true;

  trackerWord.find();
  if (await trackerWord.exists) return true;

  return false;
}
