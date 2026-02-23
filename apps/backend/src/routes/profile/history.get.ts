import { type } from 'arktype';

import { player } from '~/database/repositories/player';
import { PlayerMessage } from '~/types/response';
import { define } from '~/utils/define';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const ProfileHistoryQuery = type({
  'discord_id': 'string',
  'page': 'string.integer',
  'limit?': 'string.integer',
});

const ProfileHistoryItem = type({
  id: 'number',
  match_id: 'number',
  player_id: 'number',
  place: 'number',
  elo: 'number',
  created_at: 'string.date.iso',
  finished_at: 'string.date.iso',
});

const ProfileHistoryReply = type({
  message: "'PROFILE_HISTORY_FETCHED'",
  history: ProfileHistoryItem.array(),
});

export default define()
  .meta({
    path: '/profile/history',
    method: 'get',
    summary: 'Get player profile history',
    tags: ['Player'],
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
        schema: ProfileHistoryReply,
      },
    },
  })
  .guard([validate({ querystring: ProfileHistoryQuery })])
  .handle<{
    Querystring: typeof ProfileHistoryQuery.infer;
    Reply: typeof ProfileHistoryReply.infer;
  }>(async (request, reply) => {
    const { discord_id, page, limit } = request.query;

    const history = await player.history(discord_id, +page, +(limit ?? 10));

    send(reply).ok<Omit<typeof ProfileHistoryReply.infer, 'message'>>(PlayerMessage.PROFILE_HISTORY_FETCHED, {
      history,
    });
  });
