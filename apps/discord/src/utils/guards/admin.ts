import { config } from '~/config';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Guard } from '~/types/middleware';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AdminAugmentation {}

export const admin: Guard<AdminAugmentation, ChatInputCommandInteraction> = async (
  interaction: ChatInputCommandInteraction
): Promise<(ChatInputCommandInteraction & AdminAugmentation) | undefined> => {
  if (!config.adminRoleId) return interaction;

  const member = await interaction.guild?.members.fetch(interaction.user.id);

  if (!member || !member.roles.cache.has(config.adminRoleId)) {
    return undefined;
  }

  return Object.assign(interaction, {} as AdminAugmentation);
};
