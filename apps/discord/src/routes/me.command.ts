import { EmbedBuilder } from 'discord.js';

import { define } from '~/utils/define';
import { history } from '~/utils/guards/history';
import { player } from '~/utils/guards/player';
import { getRank } from '~/utils/rank';
import { parseWL } from '~/utils/wl';

export const description = 'Показать информацию о профиле пользователя';
export const guildOnly = ['1472119924930510902'];

export default define<'command'>()
  .guard([player, history(1)])
  .handle(interaction => {
    const wl = parseWL(interaction.history);
    const { name, color, id, image } = getRank(interaction.player);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: interaction.player.is_calibrating
          ? interaction.user.tag
          : `${interaction.user.tag} — ${interaction.player.elo.toString()} РР`,
        iconURL: interaction.user.avatarURL() ?? undefined,
      })
      .setThumbnail(id)
      .addFields(
        { name: 'W', value: wl.wins.toString(), inline: true },
        { name: 'L', value: wl.losses.toString(), inline: true },
        { name: 'Ранг', value: name, inline: true }
      );

    interaction.reply({ embeds: [embed], flags: ['Ephemeral'], files: [image] });
  });
