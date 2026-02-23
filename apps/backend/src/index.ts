import ScalarApiReference from '@scalar/fastify-api-reference';
import { adapter } from '@storona/fastify';
import Fastify from 'fastify';
import { createRouter } from 'storona';

import { config, toListenOptions } from '~/config';
import { migrate } from '~/database/migrate';
import { repo } from '~/database/repositories';
import { buildSpec, defineYaml, exportSpec } from '~/utils/openapi';
import { generateOpenApiTypes } from '~/utils/types';

async function createApp(): Promise<void> {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    ...(config.ssl
      ? {
          https: {
            key: await Bun.file(`${config.sslDir}/key.pem`).text(),
            cert: await Bun.file(`${config.sslDir}/cert.pem`).text(),
          },
        }
      : {}),
  });

  await createRouter(app, {
    directory: config.routeDirectory,
    adapter: adapter({ prefix: config.prefix }),
    quiet: false,
  });

  const yaml = defineYaml('./src/docs/**/*.yaml');
  const spec = buildSpec(yaml);
  await exportSpec(spec);

  await app.register(ScalarApiReference, {
    routePrefix: '/docs',
    configuration: { url: `${config.prefix}/openapi/json` },
  });

  await migrate();
  await repo.lobby.resetActive();
  await generateOpenApiTypes();
  await app.listen(toListenOptions(config));
}

createApp().catch(console.error);
