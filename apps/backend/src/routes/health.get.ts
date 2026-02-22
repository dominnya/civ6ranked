import { type } from 'arktype';

import { GeneralMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { send, type ApiResponse } from '~/utils/response';

const HealthReply = type({
  message: "'HEALTHY' | 'HEADLESS_UNHEALTHY'",
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
  }>(async (_request, reply) => {
    try {
      await bfetch('/health', {
        method: 'get',
        init: {
          signal: AbortSignal.timeout(150),
        },
      });

      return send(reply).ok(GeneralMessage.HEALTHY, {
        timestamp: Date.now(),
      });
    } catch {
      return send(reply).ok(GeneralMessage.HEADLESS_UNHEALTHY, {
        timestamp: Date.now(),
      });
    }
  });
