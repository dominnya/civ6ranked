import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { PlayerMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const ProfileQuery = type({
  discord_id: 'string',
});

const ProfileReply = type({
  message: "'PROFILE_FETCHED'",
  id: 'number',
  ingame_id: 'string | null',
  discord_id: 'string',
  elo: 'number',
  is_calibrating: 'boolean',
  created_at: 'string.date.iso',
});

export default define()
  .meta({
    path: '/profile',
    method: 'get',
    summary: 'Get player profile',
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
    ],
    responses: {
      200: {
        description: 'Player profile',
        schema: ProfileReply,
      },
    },
  })
  .guard([serviceAuth, validate({ querystring: ProfileQuery })])
  .handle<{
    Querystring: typeof ProfileQuery.infer;
    Reply: typeof ProfileReply.infer;
  }>(async (request, reply) => {
    const profile = await repo.player.profile(request.query.discord_id);

    send(reply).ok<Omit<typeof ProfileReply.infer, 'message'>>(PlayerMessage.PROFILE_FETCHED, profile);
  });
