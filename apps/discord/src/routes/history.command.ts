import { define } from '~/utils/define';
import { player } from '~/utils/guards/player';

export const description = 'Показать историю матчей пользователя';
export const guildOnly = ['1472119924930510902'];

export default define<'command'>()
  .guard([player])
  .handle(interaction => {
    interaction.reply({
      content: '🛠️ В работе!',
      flags: ['Ephemeral'],
    });
  });
