import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';
import { poll } from '~/utils/poll';

import type { paths } from '~types';

export const description = 'Завершить игру и посчитать результаты';
export const guildOnly = ['1472119924930510902'];

type Responses =
  | paths['/game/finish']['delete']['responses']['202']['content']['application/json']['message']
  | paths['/game/finish']['get']['responses']['200']['content']['application/json']['message']
  | paths['/game/finish']['get']['responses']['400']['content']['application/json']['message']
  | paths['/game/finish']['get']['responses']['404']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  FINISHED: '✅ Игра сохранена, результаты будут доступны скоро!',
  NOT_IN_GAME: '❌ Бот не состоит в игре!',
  NOT_OWNER: '🚫 Вы не владелец лобби!',
  NO_AVAILABLE_MACHINE: '❌ Бот для завершения игры недоступен!',
  TASK_ACCEPTED: '⏳ Завершение игры в процессе, пожалуйста, подождите...',
  TASK_NOT_FOUND: '❌ Ошибка поиска задачи!',
  TASK_STATUS: '⏳ Завершение игры в процессе, пожалуйста, подождите...',
  UNKNOWN_GAME_ERROR: '❌ Неизвестная ошибка игры!',
  VALIDATION_ERROR: '❌ Неверный формат запроса!',
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

    const task = await bfetch('/game/finish', {
      method: 'delete',
      body: {
        lobby_id: interaction.lobby.id,
        owner_id: interaction.player.id,
      },
    });

    await interaction.deferReply();

    const response = await poll(
      () =>
        bfetch('/game/finish', {
          method: 'get',
          query: {
            task_id: task.task_id.toString(),
          },
        }),
      2000
    );

    await interaction.editReply({
      content: RESPONSE_MESSAGES[response.message],
    });
  });
