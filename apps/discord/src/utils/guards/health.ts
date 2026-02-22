import { bfetch } from '~/utils/bfetch';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guard } from '~/types/middleware';
import type { paths } from '~types';

interface HealthAugmentation {
  readonly health: paths['/health']['get']['responses']['200']['content']['application/json']['message'];
}

export const health: Guard<HealthAugmentation, ChatInputCommandInteraction> = async (
  interaction: ChatInputCommandInteraction
): Promise<(ChatInputCommandInteraction & HealthAugmentation) | undefined> => {
  const health = await bfetch('/health', {
    method: 'get',
  });

  if (health.message === 'HEADLESS_UNHEALTHY') {
    await interaction.reply('⚠️ Локальная машина временно недоступна. Пожалуйста, обратитесь к администратору системы.');
    return undefined;
  }

  return Object.assign(interaction, { health: health.message } as HealthAugmentation);
};
