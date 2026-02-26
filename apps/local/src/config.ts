import { screen } from '@nut-tree-fork/nut-js';

import type { FastifyListenOptions } from 'fastify';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly prefix: `/${string}`;
  readonly routeDirectory: string;
  readonly serviceToken: string;
  readonly ingameId: string;

  readonly ownUrl: string;

  readonly logsLocation: string;
  readonly savesLocation: string;

  readonly ssl: boolean;
  readonly sslDir: string;

  readonly screenWidth: number;
  readonly screenHeight: number;
}

async function createConfig(): Promise<AppConfig> {
  return {
    port: Number(process.env.PORT ?? 1313),
    host: process.env.HOST ?? '0.0.0.0',
    prefix: (process.env.API_PREFIX ?? '/api/v1') as `/${string}`,
    routeDirectory: 'src/routes',
    serviceToken: process.env.SERVICE_TOKEN ?? '',
    ingameId: process.env.INGAME_ID ?? 'civ6ranked',
    ownUrl:
      process.env.OWN_URL ??
      `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? '1313'}${process.env.API_PREFIX ?? '/api/v1'}`,
    logsLocation: process.env.LOGS_LOCATION ?? 'logs',
    savesLocation: process.env.SAVES_LOCATION ?? 'saves',
    ssl: process.env.SSL === 'true',
    sslDir: process.env.SSL_DIR ?? '',

    screenWidth: await screen.width(),
    screenHeight: await screen.height(),
  };
}

export const config: AppConfig = await createConfig();

export function toListenOptions(cfg: AppConfig): FastifyListenOptions {
  return { port: cfg.port, host: cfg.host };
}
