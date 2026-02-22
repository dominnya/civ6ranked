import { Button, mouse, Point } from '@nut-tree-fork/nut-js';

import { wait } from '~/utils/wait';

export async function openMenu() {
  // Not using Escape key because it toggles the menu
  await mouse.setPosition(new Point(1920, 0));
  await mouse.click(Button.LEFT);
  await wait(1000);
}
