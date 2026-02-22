import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';

import type { paths } from '~types';

export const description = 'Завершить игру и посчитать результаты';
export const guildOnly = ['1472119924930510902'];

type Responses =
  | paths['/game']['delete']['responses']['200']['content']['application/json']['message']
  | paths['/game']['delete']['responses']['400']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  FINISHED: '✅ Игра сохранена, результаты будут доступны скоро!',
  NOT_IN_GAME: '❌ Бот не состоит в игре!',
  UNKNOWN_GAME_ERROR: '❌ Неизвестная ошибка игры!',
};

export default define<'command'>()
  .guard([health, player, lobby])
  .handle(async interaction => {
    if (interaction.lobby === null) {
      return interaction.reply({
        content: '❌ Бот не состоит в игре!',
        flags: ['Ephemeral'],
      });
    }

    if (interaction.lobby.owner_id !== interaction.player.id) {
      return interaction.reply({
        content: '🚫 Вы не владелец лобби!',
        flags: ['Ephemeral'],
      });
    }

    const response = bfetch('/game', {
      method: 'delete',
      body: {
        id: interaction.lobby.id,
      },
    });

    await interaction.deferReply();

    await interaction.editReply({
      content: RESPONSE_MESSAGES[(await response).message],
    });
  });
