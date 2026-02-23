import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const LeaveRequestBody = type({
  owner_id: 'number',
});

const LeaveReply = type({
  message: "'LEFT'",
  id: 'number',
  code: 'string',
  owner_id: 'number',
  is_active: 'boolean',
  created_at: 'string.date.iso',
});

const LeaveError = type({
  message: "'NOT_IN_LOBBY' | 'NOT_OWNER'",
});

export default define()
  .meta({
    path: '/lobby',
    method: 'delete',
    summary: 'Leave a lobby',
    description: 'Leaves a lobby with the given owner ID',
    tags: ['Lobby'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The owner ID of the lobby to leave',
      required: true,
      schema: LeaveRequestBody,
    },
    responses: {
      200: {
        description: 'Successfully finished the lobby',
        schema: LeaveReply,
      },
      400: {
        description: 'Bad request',
        schema: LeaveError,
      },
    },
  })
  .guard([serviceAuth, validate({ body: LeaveRequestBody })])
  .handle<{
    Body: typeof LeaveRequestBody.infer;
    Reply: typeof LeaveReply.infer;
  }>(async (request, reply) => {
    try {
      const activeLobby = await repo.lobby.findActive();
      if (activeLobby === null) throw LobbyMessage.NOT_IN_LOBBY;
      if (activeLobby.owner_id !== request.body.owner_id) throw LobbyMessage.NOT_OWNER;

      const lobby = await repo.lobby.leave();
      return send(reply).ok<Omit<typeof LeaveReply.infer, 'message'>>(LobbyMessage.LEFT, lobby);
    } catch (error) {
      return send(reply).badRequest(error as LobbyMessage);
    }
  });
