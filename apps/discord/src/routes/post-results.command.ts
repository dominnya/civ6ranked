import { ApplicationCommandOptionType, ChannelType, TextChannel } from 'discord.js';

import { config } from '~/config';
import { bfetch } from '~/utils/bfetch';
import { define } from '~/utils/define';
import { admin } from '~/utils/guards/admin';
import { health } from '~/utils/guards/health';
import { player } from '~/utils/guards/player';

export const description = 'Тестовая команда, которая публикует результаты игры в указанный канал.';
export const guildOnly = ['1472119924930510902'];

export const options = [
  {
    type: ApplicationCommandOptionType.Integer,
    name: 'матч',
    description: 'Идентификатор матча для публикации результатов',
    required: true,
  },
  {
    type: ApplicationCommandOptionType.Channel,
    name: 'канал',
    description: 'Канал для публикации результатов',
    required: false,
  },
];

export default define<'command'>()
  .guard([health, player, admin])
  .handle(async interaction => {
    const matchId = interaction.options.getInteger('матч');
    const channelOption = interaction.options.getChannel('канал');

    if (!matchId) {
      return interaction.reply({
        content: '❌ Пожалуйста, укажите действительный идентификатор матча.',
        flags: ['Ephemeral'],
      });
    }

    await interaction.reply({
      content: '⏳ Получение результатов игры, пожалуйста, подождите...',
      flags: ['Ephemeral'],
    });

    if (!config.resultsChannelId && !channelOption) return;

    const channel = (channelOption ?? (await interaction.client.channels.fetch(config.resultsChannelId as string))) as TextChannel;
    if (!channel || channel.type !== ChannelType.GuildText) return;

    const results = await bfetch('/game', {
      method: 'get',
      query: {
        match_id: matchId.toString(),
      },
    });

    if (results.message !== 'FINISHED') {
      return channel.send(`❌ Не удалось получить результаты игры #${matchId}`);
    }

    const header = [`# ${results.turn} Ход`];
    const urls = results.urls
      ? [
          `-# ├ [Файл сохранения](${results.urls.save_url})`,
          `-# ├ [Первый файл статистики](${results.urls.stats_url})`,
          `-# └ [Второй файл статистики](${results.urls.stats2_url})`,
        ]
      : [];

    const playerResults = results.results.map(result => {
      const player = result.discord_id ? `<@${result.discord_id}> (${result.ingame_id})` : result.ingame_id;
      const rr = result.rr > 0 ? `+${result.rr}` : result.rr.toString();
      return [`${result.place}. ${player}`, '```diff', `${rr} -> ${result.elo}`, '```'].join('\n');
    });

    await channel.send([header, ...urls, '', ...playerResults].join('\n'));
  });
