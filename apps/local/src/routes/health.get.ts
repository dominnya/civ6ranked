import { type } from 'arktype';

import { GeneralMessage } from '~/types/response';
import { define } from '~/utils/define';
import { send, type ApiResponse } from '~/utils/response';

const HealthReply = type({
  message: "'HEALTHY'",
  timestamp: 'number',
});

export default define()
  .meta({
    path: '/health',
    method: 'get',
    summary: 'Health check',
    description: 'Returns the current health status and server timestamp.',
    tags: ['General'],
    responses: {
      200: {
        description: 'Healthy response.',
        schema: HealthReply,
      },
    },
  })
  .handle<{
    Reply: ApiResponse & { timestamp: number };
  }>((_request, reply) => {
    return send(reply).ok(GeneralMessage.HEALTHY, {
      timestamp: Date.now(),
    });
  });
