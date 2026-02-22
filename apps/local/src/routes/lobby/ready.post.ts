import { type } from 'arktype';

import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { isInLobby } from '~/utils/nut/isInLobby';
import { readyLobby } from '~/utils/nut/readyLobby';
import { send } from '~/utils/response';

const ReadyReply = type({
  message: "'READY'",
});

const ReadyError = type({
  message: "'UNKNOWN_LOBBY_ERROR' | 'NOT_IN_LOBBY'",
});

export default define()
  .meta({
    path: '/lobby/ready',
    method: 'post',
    summary: 'Ready in the lobby',
    description: 'Ready in the lobby to start the game',
    tags: ['Lobby'],
    responses: {
      200: {
        description: 'Successfully ready in the lobby',
        schema: ReadyReply,
      },
      400: {
        description: 'Bad request',
        schema: ReadyError,
      },
    },
  })
  .guard([serviceAuth])
  .handle<{
    Reply: typeof ReadyReply.infer;
  }>(async (_request, reply) => {
    try {
      if (!(await isInLobby())) return send(reply).badRequest(LobbyMessage.NOT_IN_LOBBY);

      await readyLobby();
      return send(reply).ok(LobbyMessage.READY);
    } catch {
      return send(reply).badRequest(LobbyMessage.UNKNOWN_LOBBY_ERROR);
    }
  });
