import type { FastifyListenOptions } from 'fastify';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly prefix: `/${string}`;
  readonly routeDirectory: string;
  readonly serviceToken: string;
  readonly username: string;

  readonly logsLocation: string;
  readonly savesLocation: string;

  readonly ssl: boolean;
  readonly sslKeyPath: string;
  readonly sslCertPath: string;
}

function createConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 1313),
    host: process.env.HOST ?? '0.0.0.0',
    prefix: (process.env.API_PREFIX ?? '/api/v1') as `/${string}`,
    routeDirectory: 'src/routes',
    serviceToken: process.env.SERVICE_TOKEN ?? '',
    username: process.env.USERNAME ?? 'civ6ranked',
    logsLocation: process.env.LOGS_LOCATION ?? 'logs',
    savesLocation: process.env.SAVES_LOCATION ?? 'saves',
    ssl: process.env.SSL === 'true',
    sslKeyPath: process.env.SSL_KEY_PATH ?? '',
    sslCertPath: process.env.SSL_CERT_PATH ?? '',
  };
}

export const config: AppConfig = createConfig();

export function toListenOptions(cfg: AppConfig): FastifyListenOptions {
  return { port: cfg.port, host: cfg.host };
}
