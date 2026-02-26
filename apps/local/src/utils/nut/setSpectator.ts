import { Button, mouse, Point } from '@nut-tree-fork/nut-js';

import { config } from '~/config';
import { LobbyMessage } from '~/types/response';
import { wait } from '~/utils/wait';
import { word } from '~/utils/word';

export async function setSpectator(): Promise<LobbyMessage> {
  const username = word(config.ingameId);

  if (!(await username.exists)) {
    username.find();
    if (!(await username.exists)) {
      return LobbyMessage.UNKNOWN_LOBBY_ERROR;
    }
  }

  const usernamePoint = await username.point();
  if (!usernamePoint) return LobbyMessage.UNKNOWN_LOBBY_ERROR;

  await mouse.setPosition(new Point(config.screenWidth / 2, usernamePoint.y));
  await mouse.click(Button.LEFT);
  await wait(1000);

  const spectator = word('Spectator');

  if (!(await spectator.exists)) {
    spectator.find();
    if (!(await spectator.exists)) {
      return LobbyMessage.UNKNOWN_LOBBY_ERROR;
    }
  }

  const spectatorPoint = await spectator.point();
  if (!spectatorPoint) return LobbyMessage.UNKNOWN_LOBBY_ERROR;

  await mouse.setPosition(new Point(config.screenWidth / 2, spectatorPoint.y));
  await mouse.click(Button.LEFT);

  return LobbyMessage.READY;
}
