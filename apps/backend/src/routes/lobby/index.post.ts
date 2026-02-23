import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const JoinRequestBody = type({
  code: '/^[A-Za-z0-9]{3}-[A-Za-z0-9]{3,4}$/',
  owner_id: 'number',
});

const JoinReply = type({
  message: "'JOINED'",
  id: 'number',
  code: 'string',
  owner_id: 'number',
  is_active: 'boolean',
  created_at: 'string.date.iso',
});

const JoinError = type({
  message: "'UNKNOWN_LOBBY_ERROR' | 'LOBBY_NOT_FOUND' | 'INVALID_LOBBY_CODE' | 'ALREADY_IN_LOBBY' | 'LOBBY_WAIT_TOO_LONG'",
});

export default define()
  .meta({
    path: '/lobby',
    method: 'post',
    summary: 'Join a lobby',
    description: 'Joins a lobby with the given code',
    tags: ['Lobby'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The code of the lobby to join',
      required: true,
      schema: JoinRequestBody,
    },
    responses: {
      200: {
        description: 'Successfully joined the lobby',
        schema: JoinReply,
      },
      400: {
        description: 'Bad request',
        schema: JoinError,
      },
    },
  })
  .guard([serviceAuth, validate({ body: JoinRequestBody })])
  .handle<{
    Body: typeof JoinRequestBody.infer;
    Reply: typeof JoinReply.infer;
  }>(async (request, reply) => {
    try {
      const lobby = await repo.lobby.join(request.body.code, request.body.owner_id);
      return send(reply).ok<Omit<typeof JoinReply.infer, 'message'>>(LobbyMessage.JOINED, lobby);
    } catch (error) {
      return send(reply).badRequest(error as LobbyMessage);
    }
  });
