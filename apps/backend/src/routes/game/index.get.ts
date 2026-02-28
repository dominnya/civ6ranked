import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { GameMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const querystring = type({
  match_id: 'string.integer',
});

const reply200 = type({
  message: "'FINISHED'",
  turn: 'number.integer',
  results: type({
    ingame_id: 'string',
    discord_id: 'string | null',
    rr: 'number.integer',
    elo: 'number.integer',
    place: 'number.integer',
  }).array(),
  urls: type({
    save_url: 'string',
    stats_url: 'string',
    stats2_url: 'string',
  }).or('null'),
});

const reply404 = type({
  message: "'NOT_FOUND'",
});

const reply500 = type({
  message: "'UNKNOWN_SAVE_ERROR'",
});

export default define()
  .meta({
    path: '/game',
    method: 'get',
    summary: 'Get game result from database',
    description: 'Retrieve the results of a specific game from the database.',
    tags: ['Game', 'Manual'],
    security: [{ serviceAuth: [] }],
    parameters: [
      {
        name: 'match_id',
        in: 'query',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Success',
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
  .guard([serviceAuth, validate({ querystring })])
  .handle<{
    Querystring: typeof querystring.infer;
  }>(async (request, reply) => {
    const matchId = Number(request.query.match_id);
    const turn = await repo.game.getTurn(matchId);
    const results = await repo.game.getResults(matchId);
    const urls = await repo.game.getMatchUrls(matchId);

    if (results.length === 0) {
      return send(reply).notFound(GameMessage.NOT_FOUND);
    }

    return send(reply).ok(GameMessage.FINISHED, {
      turn,
      results,
      urls,
    });
  });
