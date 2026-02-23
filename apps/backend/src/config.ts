import type { FastifyListenOptions } from 'fastify';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly prefix: `/${string}`;
  readonly routeDirectory: string;
  readonly databaseUrl: string;

  readonly machineHost: string;
  readonly machinePort: number;
  readonly machinePrefix: `/${string}`;
  readonly machineToken: string;

  readonly ssl: boolean;
  readonly sslKeyPath: string;
  readonly sslCertPath: string;

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
    machineHost: process.env.MACHINE_HOST ?? 'localhost',
    machinePort: Number(process.env.MACHINE_PORT ?? 1313),
    machinePrefix: (process.env.MACHINE_PREFIX ?? '/api/v1') as `/${string}`,
    machineToken: process.env.MACHINE_TOKEN ?? '',
    ssl: process.env.SSL === 'true',
    sslKeyPath: process.env.SSL_KEY_PATH ?? '',
    sslCertPath: process.env.SSL_CERT_PATH ?? '',
    serviceToken: process.env.SERVICE_TOKEN ?? '',
  };
}

export const config: AppConfig = createConfig();

export function toListenOptions(cfg: AppConfig): FastifyListenOptions {
  return { port: cfg.port, host: cfg.host };
}
