import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

// Owner is only allowed to have one lobby, so we can fetch the lobby by owner_id/discord_id
const querystring = type({
  owner_id: 'string.integer',
}).or({
  discord_id: 'string',
});

const reply200 = type({
  message: "'LOBBY_FETCHED'",
  lobby: type({
    id: 'number.integer',
    match_id: 'number.integer',
    owner_id: 'number.integer',
    code: 'string',
    is_active: 'boolean',
    created_at: 'string.date.iso',
  }).or('null'),
});

export default define()
  .meta({
    path: '/lobby',
    method: 'get',
    summary: 'Get current lobby',
    tags: ['Lobby'],
    security: [{ serviceAuth: [] }],
    parameters: [
      {
        name: 'owner_id',
        in: 'query',
        required: false,
      },
      {
        name: 'discord_id',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Get current lobby',
        schema: reply200,
      },
    },
  })
  .guard([serviceAuth, validate({ querystring })])
  .handle<{
    Querystring: typeof querystring.infer;
    Reply: typeof reply200.infer;
  }>(async (request, reply) => {
    if ('owner_id' in request.query) {
      const lobby = await repo.lobby.getByOwnerId(Number(request.query.owner_id));

      return send(reply).ok<Omit<typeof reply200.infer, 'message'>>(LobbyMessage.LOBBY_FETCHED, { lobby });
    }

    if ('discord_id' in request.query) {
      const lobby = await repo.lobby.getByDiscordId(request.query.discord_id);

      return send(reply).ok<Omit<typeof reply200.infer, 'message'>>(LobbyMessage.LOBBY_FETCHED, { lobby });
    }

    send(reply).badRequest(LobbyMessage.LOBBY_NOT_FOUND);
  });
