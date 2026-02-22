import { adapter } from '@storona/discord.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { createRouter } from 'storona';

import { config } from '~/config';
import { generateOpenApiTypes } from '~/utils/types';

async function createApp(): Promise<void> {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  await createRouter(client, {
    directory: config.routeDirectory,
    adapter: adapter({
      registerCommands: true,
    }),
    quiet: false,
  });

  await generateOpenApiTypes();
  await client.login(config.botToken);
}

createApp().catch(console.error);
