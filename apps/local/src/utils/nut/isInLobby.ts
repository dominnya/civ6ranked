import { word } from '~/utils/word';

export async function isInLobby() {
  const stagingWord = word('STAGING');
  if (await stagingWord.exists) return true;

  stagingWord.find();
  if (await stagingWord.exists) return true;

  return false;
}
