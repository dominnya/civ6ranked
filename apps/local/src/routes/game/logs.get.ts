import { existsSync } from 'fs';
import { join } from 'path';

import { type } from 'arktype';

import { config } from '~/config';
import { GameMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { send } from '~/utils/response';

const GameLogsError = type({
  message: "'LOGS_MISSING'",
});

const LOGS_LOCATION = {
  'Player_Stats.csv': join(config.logsLocation, 'Player_Stats.csv'),
  'Player_Stats_2.csv': join(config.logsLocation, 'Player_Stats_2.csv'),
  'latest.Civ6Save': join(config.savesLocation, 'latest.Civ6Save'),
};

export default define()
  .meta({
    path: '/game/logs',
    method: 'get',
    summary: 'Get game logs',
    description: 'Retrieves the game logs',
    tags: ['Game'],
    security: [{ serviceAuth: [] }],
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
      const logs: Bun.ArchiveInput = {};

      for (const [name, path] of Object.entries(LOGS_LOCATION)) {
        if (!existsSync(path)) {
          send(reply).badRequest(GameMessage.LOGS_MISSING);
          return;
        }

        logs[name] = await Bun.file(path).arrayBuffer();
      }

      const blob = await new Bun.Archive(logs).blob();

      reply
        .code(200)
        .header('Content-Type', 'application/gzip')
        .header('Content-Disposition', 'attachment; filename="logs.tar.gz"')
        .header('Content-Length', blob.size);

      reply.send(blob.stream());
    } catch {
      return send(reply).badRequest(GameMessage.UNKNOWN_GAME_ERROR);
    }
  });
