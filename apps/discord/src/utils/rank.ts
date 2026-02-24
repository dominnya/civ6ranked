import { AttachmentBuilder } from 'discord.js';

import type { paths } from '~types';

type FixedArray<T, N extends number> = N extends N ? FixedArrayHelper<T, N, []> : never;

type FixedArrayHelper<T, N extends number, R extends T[]> = R['length'] extends N ? R : FixedArrayHelper<T, N, [...R, T]>;

interface Rank<T extends number> {
  name: string;
  color: number;
  subranks: FixedArray<Subrank, T>;
}

interface Subrank {
  elo: number;
  name: string;
  attachment: {
    id: `attachment://${string}`;
    file: AttachmentBuilder;
  };
}

interface SubrankMeta extends Subrank {
  originName: string;
  color: number;
}

const RANK: Rank<1 | 3>[] = [
  {
    name: 'Железо',
    color: 0x4b4b4b,
    subranks: [
      {
        elo: 0,
        name: 'Железо 1',
        attachment: {
          id: 'attachment://iron-1.png',
          file: new AttachmentBuilder('public/rank/iron-1.png'),
        },
      },
      {
        elo: 100,
        name: 'Железо 2',
        attachment: {
          id: 'attachment://iron-2.png',
          file: new AttachmentBuilder('public/rank/iron-2.png'),
        },
      },
      {
        elo: 200,
        name: 'Железо 3',
        attachment: {
          id: 'attachment://iron-3.png',
          file: new AttachmentBuilder('public/rank/iron-3.png'),
        },
      },
    ],
  },
  {
    name: 'Бронза',
    color: 0x927951,
    subranks: [
      {
        elo: 300,
        name: 'Бронза 1',
        attachment: {
          id: 'attachment://bronze-1.png',
          file: new AttachmentBuilder('public/rank/bronze-1.png'),
        },
      },
      {
        elo: 400,
        name: 'Бронза 2',
        attachment: {
          id: 'attachment://bronze-2.png',
          file: new AttachmentBuilder('public/rank/bronze-2.png'),
        },
      },
      {
        elo: 500,
        name: 'Бронза 3',
        attachment: {
          id: 'attachment://bronze-3.png',
          file: new AttachmentBuilder('public/rank/bronze-3.png'),
        },
      },
    ],
  },
  {
    name: 'Серебро',
    color: 0xb6bec2,
    subranks: [
      {
        elo: 600,
        name: 'Серебро 1',
        attachment: {
          id: 'attachment://silver-1.png',
          file: new AttachmentBuilder('public/rank/silver-1.png'),
        },
      },
      {
        elo: 700,
        name: 'Серебро 2',
        attachment: {
          id: 'attachment://silver-2.png',
          file: new AttachmentBuilder('public/rank/silver-2.png'),
        },
      },
      {
        elo: 800,
        name: 'Серебро 3',
        attachment: {
          id: 'attachment://silver-3.png',
          file: new AttachmentBuilder('public/rank/silver-3.png'),
        },
      },
    ],
  },
  {
    name: 'Золото',
    color: 0xd9c053,
    subranks: [
      {
        elo: 900,
        name: 'Золото 1',
        attachment: {
          id: 'attachment://gold-1.png',
          file: new AttachmentBuilder('public/rank/gold-1.png'),
        },
      },
      {
        elo: 1000,
        name: 'Золото 2',
        attachment: {
          id: 'attachment://gold-2.png',
          file: new AttachmentBuilder('public/rank/gold-2.png'),
        },
      },
      {
        elo: 1100,
        name: 'Золото 3',
        attachment: {
          id: 'attachment://gold-3.png',
          file: new AttachmentBuilder('public/rank/gold-3.png'),
        },
      },
    ],
  },
  {
    name: 'Мастер',
    color: 0x97151e,
    subranks: [
      {
        elo: 1200,
        name: 'Мастер',
        attachment: {
          id: 'attachment://master.png',
          file: new AttachmentBuilder('public/rank/master.png'),
        },
      },
    ],
  },
];

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
 * 1200+ - public/rank/master.png
 */
export function getRank(player: paths['/profile']['get']['responses']['200']['content']['application/json']): SubrankMeta {
  if (player.is_calibrating)
    return {
      originName: 'Калибровка',
      color: 0x000000,
      elo: 0,
      name: 'Калибровка',
      attachment: {
        id: 'attachment://calibrating-1.png',
        file: new AttachmentBuilder('public/rank/calibrating-1.png'),
      },
    };

  // Find rank first by elo, then determine subrank
  const rank = RANK.toReversed().find(rank => player.elo >= rank.subranks[0].elo);
  const subrank = rank?.subranks.toReversed().find(subrank => player.elo >= subrank.elo);

  return {
    originName: subrank?.name ?? rank?.name ?? 'Без ранга',
    color: rank?.color ?? 0x000000,
    elo: player.elo,
    name: subrank?.name ?? rank?.name ?? 'Без ранга',
    attachment: subrank?.attachment ?? {
      id: 'attachment://iron-1.png',
      file: new AttachmentBuilder('public/rank/iron-1.png'),
    },
  };
}
