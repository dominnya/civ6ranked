import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { PlayerMessage } from '~/types/response';
import { define } from '~/utils/define';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const querystring = type({
  discord_id: 'string',
});

const reply200 = type({
  message: "'PROFILE_FETCHED'",
  id: 'number.integer',
  ingame_id: 'string | null',
  discord_id: 'string',
  elo: 'number.integer',
  is_calibrating: 'boolean',
  created_at: 'string.date.iso',
});

export default define()
  .meta({
    path: '/profile',
    method: 'get',
    summary: 'Get player profile',
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
    ],
    responses: {
      200: {
        description: 'Player profile',
        schema: reply200,
      },
    },
  })
  .guard([validate({ querystring })])
  .handle<{
    Querystring: typeof querystring.infer;
    Reply: typeof reply200.infer;
  }>(async (request, reply) => {
    const profile = await repo.player.profile(request.query.discord_id);

    send(reply).ok<Omit<typeof reply200.infer, 'message'>>(PlayerMessage.PROFILE_FETCHED, profile);
  });
