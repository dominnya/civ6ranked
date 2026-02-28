export interface AppConfig {
  readonly botToken: string;
  readonly serviceUrl: string;
  readonly serviceToken: string;
  readonly routeDirectory: string;
  readonly resultsChannelId?: string;
  readonly adminRoleId?: string;
}

function createConfig(): AppConfig {
  return {
    botToken: process.env.BOT_TOKEN ?? '',
    serviceUrl: process.env.SERVICE_URL ?? 'http://localhost:1212',
    serviceToken: process.env.SERVICE_TOKEN ?? '',
    routeDirectory: 'src/routes',
    resultsChannelId: process.env.RESULTS_CHANNEL_ID,
    adminRoleId: process.env.ADMIN_ROLE_ID,
  };
}

export const config: AppConfig = createConfig();
