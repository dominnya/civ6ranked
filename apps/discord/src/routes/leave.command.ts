import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';
import { poll } from '~/utils/poll';

import type { paths } from '~types';

export const description = 'Покинуть существующее лобби';
export const guildOnly = ['1472119924930510902'];

type Responses =
  | paths['/lobby/leave']['delete']['responses']['202']['content']['application/json']['message']
  | paths['/lobby/leave']['get']['responses']['200']['content']['application/json']['message']
  | paths['/lobby/leave']['get']['responses']['400']['content']['application/json']['message']
  | paths['/lobby/leave']['get']['responses']['404']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  LEFT: '✅ Бот успешно покинул лобби!',
  LOBBY_NOT_FOUND: '❌ Лобби не найдено!',
  NOT_IN_LOBBY: '🚫 Бот не состоит в лобби!',
  NOT_OWNER: '🚫 Вы не можете покинуть лобби, созданное другим игроком!',
  NO_AVAILABLE_MACHINE: '❌ Бот для покидания лобби недоступен!',
  TASK_ACCEPTED: '⏳ Покидание лобби в процессе, пожалуйста, подождите...',
  TASK_NOT_FOUND: '❌ Ошибка поиска задачи!',
  TASK_STATUS: '⏳ Покидание лобби в процессе, пожалуйста, подождите...',
  UNKNOWN_LOBBY_ERROR: '❌ Неизвестная ошибка лобби!',
  VALIDATION_ERROR: '❌ Неверный формат запроса!',
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

    const task = await bfetch('/lobby/leave', {
      method: 'delete',
      body: {
        lobby_id: interaction.lobby.id,
        owner_id: interaction.player.id,
      },
    });

    await interaction.deferReply();

    const response = await poll(
      () =>
        bfetch('/lobby/leave', {
          method: 'get',
          query: {
            task_id: task.task_id.toString(),
          },
        }),
      1000
    );

    await interaction.editReply({
      content: RESPONSE_MESSAGES[response.message],
    });
  });
