import type { FastifyListenOptions } from 'fastify';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly prefix: `/${string}`;
  readonly routeDirectory: string;
  readonly databaseUrl: string;

  readonly ownUrl: string;
  readonly machineUrl: string;

  readonly ssl: boolean;
  readonly sslDir: string;

  readonly serviceToken: string;
}

function createConfig(): AppConfig {
  const databaseUrl = `postgres://${process.env.POSTGRES_USER ?? 'civ6ranked'}:${process.env.POSTGRES_PASSWORD ?? 'civ6ranked'}@${
    process.env.POSTGRES_HOST ?? 'localhost'
  }:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'civ6ranked'}`;

  return {
    port: Number(process.env.PORT ?? 1212),
    host: process.env.HOST ?? '0.0.0.0',
    prefix: (process.env.API_PREFIX ?? '/api/v1') as `/${string}`,
    routeDirectory: 'src/routes',
    databaseUrl,
    ownUrl:
      process.env.OWN_URL ??
      `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? '1212'}${process.env.API_PREFIX ?? '/api/v1'}`,
    machineUrl: process.env.MACHINE_URL ?? 'http://localhost:1313',
    ssl: process.env.SSL === 'true',
    sslDir: process.env.SSL_DIR ?? '',
    serviceToken: process.env.SERVICE_TOKEN ?? '',
  };
}

export const config: AppConfig = createConfig();

export function toListenOptions(cfg: AppConfig): FastifyListenOptions {
  return { port: cfg.port, host: cfg.host };
}
