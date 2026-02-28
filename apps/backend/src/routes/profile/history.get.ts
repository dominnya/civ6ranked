import { type } from 'arktype';

import { player } from '~/database/repositories/player';
import { PlayerMessage } from '~/types/response';
import { define } from '~/utils/define';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const querystring = type({
  'discord_id': 'string',
  'page': 'string.integer',
  'limit?': 'string.integer',
});

const reply200 = type({
  message: "'PROFILE_HISTORY_FETCHED'",
  history: type({
    id: 'number.integer',
    match_id: 'number.integer',
    player_id: 'number.integer',
    place: 'number.integer',
    rr: 'number.integer',
    created_at: 'string.date.iso',
    finished_at: 'string.date.iso',
  }).array(),
});

export default define()
  .meta({
    path: '/profile/history',
    method: 'get',
    summary: 'Get player profile history',
    tags: ['Profile', 'Player'],
    parameters: [
      {
        name: 'discord_id',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'page',
        in: 'query',
        required: true,
        schema: {
          type: 'number',
        },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'number',
          default: 10,
        },
      },
    ],
    responses: {
      200: {
        description: 'Player profile history',
        schema: reply200,
      },
    },
  })
  .guard([validate({ querystring })])
  .handle<{
    Querystring: typeof querystring.infer;
    Reply: typeof reply200.infer;
  }>(async (request, reply) => {
    const { discord_id, page, limit } = request.query;

    const history = await player.history(discord_id, +page, +(limit ?? 10));

    send(reply).ok<Omit<typeof reply200.infer, 'message'>>(PlayerMessage.PROFILE_HISTORY_FETCHED, {
      history,
    });
  });
