import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { send } from '~/utils/response';

const LobbyReply = type({
  message: "'LOBBY_FETCHED'",
  lobby: type({
    id: 'number',
    match_id: 'number',
    owner_id: 'number',
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
    responses: {
      200: {
        description: 'Get current lobby',
        schema: LobbyReply,
      },
    },
  })
  .guard([serviceAuth])
  .handle<{
    Reply: typeof LobbyReply.infer;
  }>(async (_request, reply) => {
    const lobby = await repo.lobby.findActive();

    send(reply).ok<Omit<typeof LobbyReply.infer, 'message'>>(LobbyMessage.LOBBY_FETCHED, { lobby });
  });
