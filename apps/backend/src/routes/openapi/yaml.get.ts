import { define } from '@storona/fastify';

import { SPEC_PATH_YAML } from '~/utils/openapi';

export default define(async (_request, reply) => {
  reply.header('Content-Type', 'application/yaml');
  reply.header('Content-Disposition', 'attachment; filename="openapi.yaml"');
  reply.send(await Bun.file(SPEC_PATH_YAML).text());
});
