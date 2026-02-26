import { type } from 'arktype';

import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { queueResult } from '~/utils/guards/queueResult';
import { validate } from '~/utils/guards/validate';

const querystring = type({
  task_id: 'string.integer',
});

const reply200 = type({
  message: "'FINISHED'",
  result: type({
    id: 'number.integer',
    match_id: 'number.integer',
    match_result_id: 'number.integer',
    finished_at: 'string.date.iso',
  }),
}).or(
  type({
    message: "'TASK_STATUS'",
    summary: "'pending' | 'processing' | 'failed'",
  })
);

const reply400 = type({
  message: "'VALIDATION_ERROR' | 'UNKNOWN_GAME_ERROR' | 'NO_AVAILABLE_MACHINE' | 'NOT_IN_GAME' | 'NOT_OWNER'",
});

const reply404 = type({
  message: "'TASK_NOT_FOUND'",
});

export default define()
  .meta({
    path: '/game/finish',
    method: 'get',
    summary: 'Get finish game task status',
    description: 'Get the status of a finish game task',
    tags: ['Game', 'Finish'],
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
