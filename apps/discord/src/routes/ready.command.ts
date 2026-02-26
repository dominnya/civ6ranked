import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';
import { poll } from '~/utils/poll';

import type { paths } from '~types';

export const description = 'Приказать готовность к игре';
export const guildOnly = ['1472119924930510902'];

type Responses =
  | paths['/lobby/ready']['post']['responses']['202']['content']['application/json']['message']
  | paths['/lobby/ready']['get']['responses']['200']['content']['application/json']['message']
  | paths['/lobby/ready']['get']['responses']['400']['content']['application/json']['message']
  | paths['/lobby/ready']['get']['responses']['404']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  LOBBY_NOT_FOUND: '❌ Лобби не найдено!',
  NOT_IN_LOBBY: '🚫 Бот не состоит в лобби!',
  NOT_OWNER: '🚫 Вы не владелец лобби!',
  NO_AVAILABLE_MACHINE: '❌ Бот для смены статуса готовности недоступен!',
  READY: '✅ Успешно сменил статус готовности!',
  TASK_ACCEPTED: '⏳ Смена статуса готовности в процессе, пожалуйста, подождите...',
  TASK_NOT_FOUND: '❌ Ошибка поиска задачи!',
  TASK_STATUS: '⏳ Смена статуса готовности в процессе, пожалуйста, подождите...',
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
        content: '🚫 Вы не владелец лобби!',
        flags: ['Ephemeral'],
      });
    }

    const task = await bfetch('/lobby/ready', {
      method: 'post',
      body: {
        lobby_id: interaction.lobby.id,
        owner_id: interaction.player.id,
      },
    });

    await interaction.deferReply();

    const response = await poll(
      () =>
        bfetch('/lobby/ready', {
          method: 'get',
          query: {
            task_id: task.task_id.toString(),
          },
        }),
      1000
    );

    return interaction.editReply({
      content: RESPONSE_MESSAGES[response.message],
    });
  });
