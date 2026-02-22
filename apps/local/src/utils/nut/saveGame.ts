import { Button, Key, keyboard, mouse, Point } from '@nut-tree-fork/nut-js';

import { GameMessage } from '~/types/response';
import { wait } from '~/utils/wait';
import { word } from '~/utils/word';

export async function saveGame(): Promise<GameMessage> {
  // It will find QUICK SAVE GAME first
  const saveWord = word('SAVE');

  if (!(await saveWord.exists)) {
    saveWord.find();
    if (!(await saveWord.exists)) return GameMessage.UNKNOWN_GAME_ERROR;
  }

  const savePoint = await saveWord.point();

  if (!savePoint) return GameMessage.UNKNOWN_GAME_ERROR;

  await mouse.setPosition(new Point(savePoint.x, savePoint.y + 25));
  await mouse.click(Button.LEFT);
  await wait(1000);

  await keyboard.type(Key.LeftControl, Key.A);
  await keyboard.type(Key.Backspace);
  await keyboard.type('latest');

  // Not using 'Save' detect as it does not work
  await mouse.setPosition(new Point(1920 / 2 - 50, 1080 - 25));
  await mouse.click(Button.LEFT);
  await wait(1000);

  const overwriteWord = word('Overwrite');

  if (!(await overwriteWord.exists)) {
    overwriteWord.find();
    if (!(await overwriteWord.exists)) return GameMessage.SAVED;
  }

  await mouse.setPosition(new Point(1920 / 2 - 50, 1080 / 2 + 25));
  await mouse.click(Button.LEFT);
  await wait(1000);

  return GameMessage.SAVED;
}
