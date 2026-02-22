import { bfetch } from '~/utils/bfetch';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guard } from '~/types/middleware';
import type { paths } from '~types';

interface HistoryAugmentation {
  readonly history: paths['/profile/history']['get']['responses']['200']['content']['application/json'];
}

export const history: (page?: number) => Guard<HistoryAugmentation, ChatInputCommandInteraction> =
  (page = 1) =>
  async (interaction: ChatInputCommandInteraction): Promise<(ChatInputCommandInteraction & HistoryAugmentation) | undefined> => {
    const history = await bfetch('/profile/history', {
      method: 'get',
      query: {
        discord_id: interaction.user.id,
        page,
      },
    });

    return Object.assign(interaction, { history } as HistoryAugmentation);
  };
