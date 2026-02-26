import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { enqueue, queueResponse } from '~/utils/guards/enqueue';
import { validate } from '~/utils/guards/validate';

const body = type({
  lobby_id: 'number.integer',
  owner_id: 'number.integer',
});

const reply202 = type({
  message: "'TASK_ACCEPTED'",
  task_id: 'number.integer',
  status: 'string',
  created_at: 'string.date.iso',
});

export default define()
  .meta({
    path: '/lobby/leave',
    method: 'delete',
    summary: 'Leave a lobby',
    description: 'Enqueues a task to leave a lobby with the given owner ID',
    tags: ['Lobby', 'Leave'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The owner ID of the lobby to leave',
      required: true,
      schema: body,
    },
    responses: {
      202: {
        description: 'Task accepted',
        schema: reply202,
      },
    },
  })
  .guard([serviceAuth, validate({ body }), enqueue])
  .handle<{
    Body: typeof body.infer;
    Reply: typeof reply202.infer;
  }>(async request => {
    const lobby = await repo.lobby.getById(request.body.lobby_id);

    if (!lobby) return queueResponse(400, { message: LobbyMessage.LOBBY_NOT_FOUND });
    if (lobby.owner_id !== request.body.owner_id) return queueResponse(400, { message: LobbyMessage.NOT_OWNER });

    request.task.setMachineId(lobby.machine_id);

    try {
      const updatedLobby = await repo.lobby.leave(lobby);
      return queueResponse(200, { message: LobbyMessage.LEFT, lobby: updatedLobby });
    } catch (error) {
      return queueResponse(400, { message: error as LobbyMessage });
    }
  });
