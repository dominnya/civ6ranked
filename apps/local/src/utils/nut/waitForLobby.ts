import { LobbyMessage } from '~/types/response';
import { isInLobby } from '~/utils/nut/isInLobby';
import { resetState } from '~/utils/nut/reset';
import { wait } from '~/utils/wait';
import { word } from '~/utils/word';

export async function waitForLobby(): Promise<LobbyMessage> {
  const lobbyWord = word('JOINING');
  if (await lobbyWord.exists) {
    await wait(5000);
    lobbyWord.find();

    if (await lobbyWord.exists) {
      await resetState();
      return LobbyMessage.LOBBY_WAIT_TOO_LONG;
    }
  }

  const retrievingWord = word('RETRIEVING');
  if (await retrievingWord.exists) {
    await wait(5000);
    retrievingWord.find();

    if (await retrievingWord.exists) {
      await resetState();
      return LobbyMessage.LOBBY_WAIT_TOO_LONG;
    }
  }

  const connectingWord = word('CONNECTING');
  if (await connectingWord.exists) {
    await wait(5000);
    connectingWord.find();

    if (await connectingWord.exists) {
      await resetState();
      return LobbyMessage.LOBBY_WAIT_TOO_LONG;
    }
  }

  const configuringWord = word('CONFIGURING');
  if (await configuringWord.exists) {
    await wait(2000);
    configuringWord.find();

    if (await configuringWord.exists) {
      await resetState();
      return LobbyMessage.LOBBY_WAIT_TOO_LONG;
    }
  }

  const errorWord = word('Error');
  if (await errorWord.exists) {
    await resetState();
    return LobbyMessage.LOBBY_NOT_FOUND;
  }

  if (await isInLobby()) return LobbyMessage.JOINED;

  await resetState();
  return LobbyMessage.LOBBY_WAIT_TOO_LONG;
}
