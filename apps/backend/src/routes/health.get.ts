import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { GeneralMessage } from '~/types/response';
import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { send } from '~/utils/response';

const reply200 = type({
  message: "'HEALTHY'",
  timestamp: 'number',
});

const reply400 = type({
  message: "'HEADLESS_UNHEALTHY'",
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
        schema: reply200,
      },
      400: {
        description: 'Unhealthy response.',
        schema: reply400,
      },
    },
  })
  .handle<{
    Reply: typeof reply200.infer | typeof reply400.infer;
  }>(async (_request, reply) => {
    try {
      // Check if at least 1 machine is available and healthy before responding with healthy status
      const machine = await repo.machine.getAvailable();
      if (!machine) throw GeneralMessage.HEADLESS_UNHEALTHY;

      await bfetch('/health', {
        method: 'get',
        machine,
        init: {
          signal: AbortSignal.timeout(400),
        },
      });

      return send(reply).ok(GeneralMessage.HEALTHY, {
        timestamp: Date.now(),
      });
    } catch {
      return send(reply).badRequest(GeneralMessage.HEADLESS_UNHEALTHY);
    }
  });
