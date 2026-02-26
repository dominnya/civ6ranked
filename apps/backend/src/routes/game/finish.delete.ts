import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { GameMessage } from '~/types/response';
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
    path: '/game/finish',
    method: 'delete',
    summary: 'Finish a game',
    description: 'Enqueues a task to finish a game with the given ID',
    tags: ['Game', 'Finish'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The ID of the game to finish',
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

    if (!lobby) return queueResponse(400, { message: GameMessage.NOT_IN_GAME });
    if (lobby.owner_id !== request.body.owner_id) return queueResponse(400, { message: GameMessage.NOT_OWNER });

    request.task.setMachineId(lobby.machine_id);

    try {
      const result = await repo.game.finish(lobby);
      return queueResponse(200, { message: GameMessage.FINISHED, result });
    } catch (error) {
      return queueResponse(400, { message: error as GameMessage });
    }
  });
