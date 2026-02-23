import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const ReadyRequestBody = type({
  owner_id: 'number',
});

const ReadyReply = type({
  message: "'READY'",
  id: 'number',
  code: 'string',
  owner_id: 'number',
  is_active: 'boolean',
  created_at: 'string.date.iso',
});

const ReadyError = type({
  message: "'UNKNOWN_LOBBY_ERROR' | 'NOT_IN_LOBBY' | 'NOT_OWNER'",
});

export default define()
  .meta({
    path: '/lobby/ready',
    method: 'post',
    summary: 'Marks the lobby as ready',
    description: 'Marks the lobby as ready, if all players are ready, the game will start',
    tags: ['Lobby'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The ID of the lobby owner',
      required: true,
      schema: ReadyRequestBody,
    },
    responses: {
      200: {
        description: 'Successfully joined the lobby',
        schema: ReadyReply,
      },
      400: {
        description: 'Bad request',
        schema: ReadyError,
      },
    },
  })
  .guard([serviceAuth, validate({ body: ReadyRequestBody })])
  .handle<{
    Body: typeof ReadyRequestBody.infer;
    Reply: typeof ReadyReply.infer;
  }>(async (request, reply) => {
    try {
      const lobby = await repo.lobby.findActive();

      if (!lobby) return send(reply).badRequest(LobbyMessage.NOT_IN_LOBBY);
      if (lobby.owner_id !== request.body.owner_id) return send(reply).badRequest(LobbyMessage.NOT_OWNER);

      const response = await bfetch('/lobby/ready', {
        method: 'post',
      });

      if (response.message !== 'READY') return send(reply).badRequest(LobbyMessage[response.message]);

      return send(reply).ok<Omit<typeof ReadyReply.infer, 'message'>>(LobbyMessage.READY, lobby);
    } catch (error) {
      return send(reply).badRequest(error as LobbyMessage);
    }
  });
