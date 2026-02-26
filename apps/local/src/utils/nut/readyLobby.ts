import { Button, mouse, Point } from '@nut-tree-fork/nut-js';

import { config } from '~/config';
import { wait } from '~/utils/wait';

export async function readyLobby() {
  await mouse.setPosition(new Point(config.screenWidth / 2, config.screenHeight - 75));
  await mouse.click(Button.LEFT);
  await wait(200);
}
