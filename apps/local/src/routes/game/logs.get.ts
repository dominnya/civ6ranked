import { existsSync } from 'fs';
import { join } from 'path';

import archiver from 'archiver';
import { type } from 'arktype';

import { config } from '~/config';
import { GameMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { send } from '~/utils/response';

const GameLogsError = type({
  message: "'LOGS_MISSING'",
});

const CSV_LOGS = [
  'City_BuildQueue.csv',
  'Cultural_Identity.csv',
  'Game_GreatPeople.csv',
  'Game_PlayerScores.csv',
  'Game_Religion.csv',
  'Player_Stats_2.csv',
  'Player_Stats.csv',
];

export default define()
  .meta({
    path: '/game/logs',
    method: 'get',
    summary: 'Get game logs',
    description: 'Retrieves the game logs',
    tags: ['Game'],
    responses: {
      200: {
        description: 'Zip file containing the game logs',
      },
      400: {
        description: 'Bad request',
        schema: GameLogsError,
      },
    },
  })
  .guard([serviceAuth])
  .handle(async (_request, reply) => {
    try {
      const archive = archiver('zip');

      archive.pipe(reply.raw);

      const addFile = (fileName: string, location: string) => {
        if (!existsSync(join(location, fileName))) {
          send(reply).badRequest(GameMessage.LOGS_MISSING);
          return;
        }
        archive.file(join(location, fileName), { name: fileName });
      };

      CSV_LOGS.forEach(fileName => addFile(fileName, config.logsLocation));
      addFile('latest.Civ6Save', config.savesLocation);

      await archive.finalize();
    } catch {
      return send(reply).badRequest(GameMessage.UNKNOWN_GAME_ERROR);
    }
  });
