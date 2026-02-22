import { define } from '@storona/fastify';

import { getSpec } from '~/utils/openapi';

export default define(async (_request, reply) => {
  const spec = await getSpec();
  reply.send(spec);
});
