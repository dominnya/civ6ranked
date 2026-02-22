import { Button, mouse, Point } from '@nut-tree-fork/nut-js';

import { wait } from '~/utils/wait';

export async function readyLobby() {
  await mouse.setPosition(new Point(960, 1080 - 75));
  await mouse.click(Button.LEFT);
  await wait(200);
}
