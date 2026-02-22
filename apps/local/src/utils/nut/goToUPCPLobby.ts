import { Point } from '@nut-tree-fork/nut-js';

import { LobbyMessage } from '~/types/response';
import { resetState } from '~/utils/nut/reset';
import { wait } from '~/utils/wait';
import { word } from '~/utils/word';

/** Either returns LobbyMessage error or Use Join Code button point. */
export async function goToUPCPLobby(): Promise<LobbyMessage | Point> {
  const unifiedWord = word('Unified');
  const multiplayerWord = word('Multiplayer');

  if (!(await unifiedWord.exists)) {
    if (!(await multiplayerWord.exists)) {
      await resetState();

      multiplayerWord.find();
      if (!(await multiplayerWord.exists)) {
        return LobbyMessage.UNKNOWN_LOBBY_ERROR;
      }
    }

    await multiplayerWord.click();
    await wait(500);

    unifiedWord.find();
    if (!(await unifiedWord.exists)) {
      multiplayerWord.find();
      await multiplayerWord.click();
      unifiedWord.find();

      if (!(await unifiedWord.exists)) {
        return LobbyMessage.UNKNOWN_LOBBY_ERROR;
      }
    }
  }

  unifiedWord.find();
  await unifiedWord.click();
  await wait(1000);

  const useJoinCodeWord = word('Use Join Code');
  if (await useJoinCodeWord.exists) {
    const joinPoint = await useJoinCodeWord.point();
    if (!joinPoint) return LobbyMessage.UNKNOWN_LOBBY_ERROR;
    return joinPoint;
  }

  const playersWord = word('Players');
  if (!(await playersWord.exists)) {
    playersWord.find();
    if (!(await playersWord.exists)) {
      await resetState();
      return LobbyMessage.UNKNOWN_LOBBY_ERROR;
    }
  }

  const playerPoint = await playersWord.point();
  if (!playerPoint) return LobbyMessage.UNKNOWN_LOBBY_ERROR;

  return new Point(playerPoint.x, playerPoint.y - 30);
}
