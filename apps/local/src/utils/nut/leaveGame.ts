import { Button, mouse, Point } from '@nut-tree-fork/nut-js';

import { config } from '~/config';
import { GameMessage } from '~/types/response';
import { wait } from '~/utils/wait';
import { word } from '~/utils/word';

export async function leaveGame(): Promise<GameMessage> {
  const mainWord = word('MAIN');

  if (!(await mainWord.exists)) {
    mainWord.find();

    if (!(await mainWord.exists)) {
      return GameMessage.UNKNOWN_GAME_ERROR;
    }
  }

  await mainWord.click();

  await mouse.setPosition(new Point(config.screenWidth / 2 - 50, config.screenHeight / 2 + 25));
  await mouse.click(Button.LEFT);
  await wait(10000);

  return GameMessage.LEFT;
}
