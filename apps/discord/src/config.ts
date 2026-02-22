export interface AppConfig {
  readonly botToken: string;
  readonly serviceHost: string;
  readonly servicePort: number;
  readonly servicePrefix: `/${string}`;
  readonly serviceToken: string;
  readonly routeDirectory: string;
}

function createConfig(): AppConfig {
  return {
    botToken: process.env.BOT_TOKEN ?? '',
    servicePort: Number(process.env.SERVICE_PORT ?? 1212),
    serviceHost: process.env.SERVICE_HOST ?? '0.0.0.0',
    servicePrefix: (process.env.SERVICE_API_PREFIX ?? '/api/v1') as `/${string}`,
    serviceToken: process.env.SERVICE_TOKEN ?? '',
    routeDirectory: 'src/routes',
  };
}

export const config: AppConfig = createConfig();
