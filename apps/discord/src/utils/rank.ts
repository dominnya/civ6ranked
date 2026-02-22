import { AttachmentBuilder } from 'discord.js';

import type { paths } from '~types';

const RANK_NAMES = [
  'Железо 1',
  'Железо 2',
  'Железо 3',
  'Бронза 1',
  'Бронза 2',
  'Бронза 3',
  'Серебро 1',
  'Серебро 2',
  'Серебро 3',
  'Золото 1',
  'Золото 2',
  'Золото 3',
  'Гроссмейстер',
];
const RANK_IDS = [
  'iron-1',
  'iron-2',
  'iron-3',
  'bronze-1',
  'bronze-2',
  'bronze-3',
  'silver-1',
  'silver-2',
  'silver-3',
  'gold-1',
  'gold-2',
  'gold-3',
  'grandmaster',
];
const RANK_COLORS = [
  0x4b4b4b, 0x4b4b4b, 0x4b4b4b, 0x674d27, 0x674d27, 0x674d27, 0xf6f8f9, 0xf6f8f9, 0xf6f8f9, 0xd9c053, 0xd9c053, 0xd9c053, 0x66080f,
];

interface Rank {
  name: string;
  color: number;
  id: string;
  image: AttachmentBuilder;
}

/**
 * 0-99 - public/rank/iron-1.png
 * 100-199 - public/rank/iron-2.png
 * 200-299 - public/rank/iron-3.png
 * 300-399 - public/rank/bronze-1.png
 * 400-499 - public/rank/bronze-2.png
 * 500-599 - public/rank/bronze-3.png
 * 600-699 - public/rank/silver-1.png
 * 700-799 - public/rank/silver-2.png
 * 800-899 - public/rank/silver-3.png
 * 900-999 - public/rank/gold-1.png
 * 1000-1099 - public/rank/gold-2.png
 * 1100-1199 - public/rank/gold-3.png
 * 1200+ - public/rank/grandmaster-1.png
 */
export function getRank(player: paths['/profile']['get']['responses']['200']['content']['application/json']): Rank {
  if (player.is_calibrating)
    return {
      name: 'Калибровка',
      color: 0x000000,
      id: 'attachment://calibrating-1.png',
      image: new AttachmentBuilder('public/rank/calibrating-1.png'),
    };

  if (player.elo > 1199)
    return {
      name: 'Гроссмейстер',
      color: 0x66080f,
      id: 'attachment://grandmaster-1.png',
      image: new AttachmentBuilder('public/rank/grandmaster-1.png'),
    };

  const rank = Math.floor(player.elo / 100);

  return {
    name: RANK_NAMES[rank],
    color: RANK_COLORS[rank],
    id: `attachment://${RANK_IDS[rank]}.png`,
    image: new AttachmentBuilder(`public/rank/${RANK_IDS[rank]}.png`),
  };
}
