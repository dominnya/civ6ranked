import { bfetch } from '~/utils/bfetch';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guard } from '~/types/middleware';
import type { paths } from '~types';

interface LobbyAugmentation {
  readonly lobby: paths['/lobby']['get']['responses']['200']['content']['application/json']['lobby'];
}

export const lobby: Guard<LobbyAugmentation, ChatInputCommandInteraction> = async (
  interaction: ChatInputCommandInteraction
): Promise<(ChatInputCommandInteraction & LobbyAugmentation) | undefined> => {
  const lobby = await bfetch('/lobby', {
    method: 'get',
  });

  return Object.assign(interaction, { lobby: lobby.lobby } as LobbyAugmentation);
};
