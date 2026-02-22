import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';

import type { paths } from '~types';

export const description = 'Приказать готовность к игре';
export const guildOnly = ['1472119924930510902'];

type Responses =
  | paths['/lobby/ready']['post']['responses']['200']['content']['application/json']['message']
  | paths['/lobby/ready']['post']['responses']['400']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  READY: '✅ Успешно сменил статус готовности!',
  NOT_IN_LOBBY: '🚫 Бот не состоит в лобби!',
  NOT_OWNER: '🚫 Вы не владелец лобби!',
  UNKNOWN_LOBBY_ERROR: '❌ Неизвестная ошибка лобби!',
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
        content: '🚫 Вы не владелец лобби!',
        flags: ['Ephemeral'],
      });
    }

    await interaction.deferReply({ flags: ['Ephemeral'] });

    const response = await bfetch('/lobby/ready', {
      method: 'post',
      body: {
        owner_id: interaction.player.id,
      },
    });

    return interaction.editReply({
      content: RESPONSE_MESSAGES[response.message],
    });
  });
