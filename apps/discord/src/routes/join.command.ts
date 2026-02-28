import { ApplicationCommandOptionType } from 'discord.js';

import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';
import { poll } from '~/utils/poll';

import type { paths } from '~types';

export const description = 'Инициализация лобби с помощью кода Unified PC Play';
export const guildOnly = ['1472119924930510902'];

export const options = [
  {
    type: ApplicationCommandOptionType.String,
    name: 'код',
    description: 'Unified PC Play код',
    required: true,
  },
];

type Responses =
  | paths['/lobby/join']['post']['responses']['202']['content']['application/json']['message']
  | paths['/lobby/join']['get']['responses']['200']['content']['application/json']['message']
  | paths['/lobby/join']['get']['responses']['400']['content']['application/json']['message']
  | paths['/lobby/join']['get']['responses']['404']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  ALREADY_IN_LOBBY: '🚫 Бот уже состоит в лобби!',
  ALREADY_OWNS_LOBBY: '🚫 Вы не можете владеть более одним лобби!',
  JOINED: '✅ Бот успешно присоединился к лобби!',
  LOBBY_NOT_FOUND: '❌ Лобби с таким кодом не найдено!',
  LOBBY_WAIT_TOO_LONG: '❌ Время ожидания входа истекло, попробуйте еще раз!',
  NO_AVAILABLE_MACHINE: '❌ Бот для входа в лобби недоступен!',
  TASK_ACCEPTED: '⏳ Вход в лобби в процессе, пожалуйста, подождите...',
  TASK_NOT_FOUND: '❌ Ошибка поиска задачи!',
  TASK_STATUS: '⏳ Вход в лобби в процессе, пожалуйста, подождите...',
  UNKNOWN_LOBBY_ERROR: '❌ Неизвестная ошибка лобби!',
  VALIDATION_ERROR: '❌ Неверный формат кода!',
};

export default define<'command'>()
  .guard([health, player, lobby])
  .handle(async interaction => {
    const code = interaction.options.getString('код');
    if (!code || !/^[A-Za-z0-9]{3}-[A-Za-z0-9]{3,4}$/.test(code)) {
      return interaction.reply({
        content: '❌ Неверный формат кода!',
        flags: ['Ephemeral'],
      });
    }

    if (interaction.lobby !== null) {
      return interaction.reply({
        content: '🚫 Бот уже состоит в лобби!',
        flags: ['Ephemeral'],
      });
    }

    const task = await bfetch('/lobby/join', {
      method: 'post',
      body: {
        code,
        owner_id: interaction.player.id,
      },
    });

    await interaction.deferReply();

    const response = await poll(
      () =>
        bfetch('/lobby/join', {
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
