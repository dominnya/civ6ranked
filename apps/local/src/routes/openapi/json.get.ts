import { define } from '@storona/fastify';

import { SPEC_PATH_JSON } from '~/utils/openapi';

export default define(async (_request, reply) => {
  reply.header('Content-Type', 'application/json');
  reply.header('Content-Disposition', 'attachment; filename="openapi.json"');
  reply.send(await Bun.file(SPEC_PATH_JSON).text());
});
