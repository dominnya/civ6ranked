import { bfetch } from '~/utils/bfetch';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guard } from '~/types/middleware';
import type { paths } from '~types';

export interface PlayerAugmentation {
  readonly player: paths['/profile']['get']['responses']['200']['content']['application/json'];
}

export const player: Guard<PlayerAugmentation, ChatInputCommandInteraction> = async (
  interaction: ChatInputCommandInteraction
): Promise<(ChatInputCommandInteraction & PlayerAugmentation) | undefined> => {
  const player = await bfetch('/profile', {
    method: 'get',
    query: {
      discord_id: interaction.user.id,
    },
  });

  return Object.assign(interaction, { player } as PlayerAugmentation);
};
