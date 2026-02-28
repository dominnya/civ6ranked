import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { GameMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { send } from '~/utils/response';

const reply200 = type({
  message: "'FINISHED'",
  results: type({
    ingameId: 'string',
    rr: 'number.integer',
    elo: 'number.integer',
  }).array(),
  urls: type({
    savePath: 'string',
    statsPath: 'string',
    stats2Path: 'string',
  }),
});

const reply404 = type({
  message: "'NOT_FOUND'",
});

const reply500 = type({
  message: "'UNKNOWN_SAVE_ERROR'",
});

export default define()
  .meta({
    path: '/game/parse',
    method: 'post',
    summary: 'Manually parse game logs',
    description: 'Manually parse game logs for a specific match and save the result to the database.',
    tags: ['Game', 'Manual'],
    security: [{ serviceAuth: [] }],
    // .tar.gz archive should be provided
    requestBody: {
      description: 'Game logs archive (.tar.gz)',
      required: true,
      contentType: 'application/gzip',
      schema: type({
        '_comment': "'File stream of a .tar.gz archive containing the game logs.'",
        'latest.Civ6Save': 'string',
        'Player_Stats.csv': 'string',
        'Player_Stats_2.csv': 'string',
      }),
    },
    responses: {
      200: {
        description: 'Game parsed successfully',
        schema: reply200,
      },
      404: {
        description: 'Not found',
        schema: reply404,
      },
      500: {
        description: 'Unknown error during save',
        schema: reply500,
      },
    },
  })
  .guard([serviceAuth])
  .handle(async (request, reply) => {
    try {
      const match = await repo.game.createEmpty();
      const results = await repo.game.calculateMatchResult(request.body as Buffer);

      try {
        await repo.game.createMatchResults(match.match_id, results);
        send(reply).ok(GameMessage.FINISHED, { results: results.results(), urls: results.urls });
      } catch {
        send(reply).internalError(GameMessage.UNKNOWN_SAVE_ERROR);
      }
    } catch {
      send(reply).notFound(GameMessage.NOT_FOUND);
    }
  });
