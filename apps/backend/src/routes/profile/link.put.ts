import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { PlayerMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const ProfileLinkRequestBody = type({
  discord_id: 'string',
  ingame_id: 'string',
});

const ProfileLinkReply = type({
  message: "'PROFILE_LINKED'",
  id: 'number',
  ingame_id: 'string',
  discord_id: 'string',
  elo: 'number',
  is_calibrating: 'boolean',
  created_at: 'string.date.iso',
});

const ProfileLinkError = type({
  message: "'INGAME_ID_ALREADY_LINKED'",
});

export default define()
  .meta({
    path: '/profile/link',
    method: 'put',
    summary: 'Link player profile',
    tags: ['Player'],
    requestBody: {
      required: true,
      schema: ProfileLinkRequestBody,
    },
    responses: {
      200: {
        description: 'Player profile linked',
        schema: ProfileLinkReply,
      },
      400: {
        description: 'Bad request',
        schema: ProfileLinkError,
      },
    },
  })
  .guard([serviceAuth, validate({ body: ProfileLinkRequestBody })])
  .handle<{
    Body: typeof ProfileLinkRequestBody.infer;
    Reply: typeof ProfileLinkReply.infer;
  }>(async (request, reply) => {
    try {
      const { discord_id, ingame_id } = request.body;

      const player = await repo.player.link(discord_id, ingame_id);

      send(reply).ok<Omit<typeof ProfileLinkReply.infer, 'message'>>(PlayerMessage.PROFILE_LINKED, player);
    } catch (error) {
      send(reply).badRequest(error as PlayerMessage);
    }
  });
