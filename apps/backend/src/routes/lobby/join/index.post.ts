import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { enqueue, queueResponse } from '~/utils/guards/enqueue';
import { validate } from '~/utils/guards/validate';

const body = type({
  code: '/^[A-Za-z0-9]{3}-[A-Za-z0-9]{3,4}$/',
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
    path: '/lobby/join',
    method: 'post',
    summary: 'Join a lobby',
    description: 'Enqueues a task to join a lobby with the given code',
    tags: ['Lobby', 'Join'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The code of the lobby to join',
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
    const machine = await repo.machine.getAvailable();
    if (!machine) return queueResponse(400, { message: LobbyMessage.NO_AVAILABLE_MACHINE });

    request.task.setMachineId(machine.id);

    try {
      const lobby = await repo.lobby.join(request.body.code, request.body.owner_id, machine);
      return queueResponse(200, { message: LobbyMessage.JOINED, lobby });
    } catch (error) {
      return queueResponse(400, { message: error as LobbyMessage });
    }
  });
