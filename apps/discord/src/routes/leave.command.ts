import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';

import type { paths } from '~types';

export const description = 'Покинуть существующее лобби';
export const guildOnly = ['1472119924930510902'];

type Responses =
  | paths['/lobby']['delete']['responses']['200']['content']['application/json']['message']
  | paths['/lobby']['delete']['responses']['400']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  LEFT: '✅ Бот успешно покинул лобби!',
  NOT_IN_LOBBY: '🚫 Бот не состоит в лобби!',
  NOT_OWNER: '🚫 Вы не можете покинуть лобби, созданное другим игроком!',
};

export default define<'command'>()
  .guard([health, player, lobby])
  .handle(async interaction => {
    if (interaction.lobby === null) {
      return interaction.reply({
        content: '🚫 Бот не состоит в лобби!',
        flags: ['Ephemeral'],
      });
    }

    if (interaction.lobby.owner_id !== interaction.player.id) {
      return interaction.reply({
        content: '🚫 Вы не можете покинуть лобби, созданное другим игроком!',
        flags: ['Ephemeral'],
      });
    }

    const response = bfetch('/lobby', {
      method: 'delete',
      body: {
        owner_id: interaction.player.id,
      },
    });

    await interaction.deferReply();

    await interaction.editReply({
      content: RESPONSE_MESSAGES[(await response).message],
    });
  });
