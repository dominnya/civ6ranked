import { type } from 'arktype';

import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { isInLobby } from '~/utils/nut/isInLobby';
import { resetState } from '~/utils/nut/reset';
import { send } from '~/utils/response';

const LeaveReply = type({
  message: "'LEFT'",
});

const LeaveError = type({
  message: "'UNKNOWN_LOBBY_ERROR' | 'NOT_IN_LOBBY'",
});

export default define()
  .meta({
    path: '/lobby',
    method: 'delete',
    summary: 'Leave a lobby',
    description: 'Leaves an existing lobby if the client is in one',
    tags: ['Lobby'],
    responses: {
      200: {
        description: 'Successfully left the lobby',
        schema: LeaveReply,
      },
      400: {
        description: 'Bad request',
        schema: LeaveError,
      },
    },
  })
  .guard([serviceAuth])
  .handle<{
    Reply: typeof LeaveReply.infer;
  }>(async (_request, reply) => {
    try {
      const inLobby = await isInLobby();
      if (!inLobby) return send(reply).badRequest(LobbyMessage.NOT_IN_LOBBY);

      await resetState();
      return send(reply).ok(LobbyMessage.LEFT);
    } catch {
      return send(reply).badRequest(LobbyMessage.UNKNOWN_LOBBY_ERROR);
    }
  });
