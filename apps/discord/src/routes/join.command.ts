import { ApplicationCommandOptionType } from 'discord.js';

import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { health } from '~/utils/guards/health';
import { lobby } from '~/utils/guards/lobby';
import { player } from '~/utils/guards/player';

import type { paths } from '~types';

export const description = 'Инициализация лобби с помощью кода Unified PC Play';
export const guildOnly = ['1472119924930510902'];

export const options = [
  {
    type: ApplicationCommandOptionType.String,
    name: 'code',
    description: 'Unified PC Play код',
    required: true,
  },
];

type Responses =
  | paths['/lobby']['post']['responses']['200']['content']['application/json']['message']
  | paths['/lobby']['post']['responses']['400']['content']['application/json']['message'];

const RESPONSE_MESSAGES: Record<Responses, string> = {
  JOINED: '✅ Бот успешно присоединился к лобби!',
  ALREADY_IN_LOBBY: '🚫 Бот уже состоит в лобби!',
  INVALID_LOBBY_CODE: '❌ Неверный формат кода!',
  LOBBY_NOT_FOUND: '❌ Лобби с таким кодом не найдено!',
  LOBBY_WAIT_TOO_LONG: '❌ Время ожидания входа истекло, попробуйте еще раз!',
  UNKNOWN_LOBBY_ERROR: '❌ Неизвестная ошибка лобби!',
};

export default define<'command'>()
  .guard([health, player, lobby])
  .handle(async interaction => {
    const code = interaction.options.getString('code');
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

    const response = bfetch('/lobby', {
      method: 'post',
      body: {
        code,
        owner_id: interaction.player.id,
      },
    });

    await interaction.deferReply();

    await interaction.editReply({
      content: RESPONSE_MESSAGES[(await response).message],
    });
  });
