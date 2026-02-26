import { type } from 'arktype';

import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { queueResult } from '~/utils/guards/queueResult';
import { validate } from '~/utils/guards/validate';

const querystring = type({
  task_id: 'string.integer',
});

const reply200 = type({
  message: "'LEFT'",
  lobby: type({
    id: 'number.integer',
    code: 'string',
    owner_id: 'number.integer',
    is_active: 'boolean',
    created_at: 'string.date.iso',
  }),
}).or(
  type({
    message: "'TASK_STATUS'",
    summary: "'pending' | 'processing' | 'failed'",
  })
);

const reply400 = type({
  message: "'VALIDATION_ERROR' | 'UNKNOWN_LOBBY_ERROR' | 'NO_AVAILABLE_MACHINE' | 'LOBBY_NOT_FOUND' | 'NOT_IN_LOBBY' | 'NOT_OWNER'",
});

const reply404 = type({
  message: "'TASK_NOT_FOUND'",
});

export default define()
  .meta({
    path: '/lobby/leave',
    method: 'get',
    summary: 'Get leave task status',
    description: 'Get the status of a leave task',
    tags: ['Lobby', 'Leave'],
    security: [{ serviceAuth: [] }],
    parameters: [
      {
        name: 'task_id',
        in: 'query',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Task status',
        schema: reply200,
      },
      400: {
        description: 'Bad request',
        schema: reply400,
      },
      404: {
        description: 'Task not found',
        schema: reply404,
      },
    },
  })
  .guard([serviceAuth, validate({ querystring }), queueResult])
  .handle(() => {});
