import { type } from 'arktype';

import { GameMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { isInGame } from '~/utils/nut/isInGame';
import { leaveGame } from '~/utils/nut/leaveGame';
import { openMenu } from '~/utils/nut/openMenu';
import { saveGame } from '~/utils/nut/saveGame';
import { send } from '~/utils/response';

const LeaveReply = type({
  message: "'LEFT'",
});

const LeaveError = type({
  message: "'UNKNOWN_GAME_ERROR' | 'NOT_IN_GAME'",
});

export default define()
  .meta({
    path: '/game',
    method: 'delete',
    summary: 'Leave a game',
    description: 'Leaves an existing game if the client is in one',
    tags: ['Game'],
    security: [{ serviceAuth: [] }],
    responses: {
      200: {
        description: 'Successfully left the game',
        schema: LeaveReply,
      },
      400: {
        description: 'Bad request',
        schema: LeaveError,
      },
    },
  })
  .guard([serviceAuth])
  .handle<{
    Reply: typeof LeaveReply.infer;
  }>(async (_request, reply) => {
    try {
      const inGame = await isInGame();

      if (!inGame) return send(reply).badRequest(GameMessage.NOT_IN_GAME);

      await openMenu();

      const saveGameResult = await saveGame();
      if (saveGameResult !== GameMessage.SAVED) {
        return send(reply).badRequest(saveGameResult);
      }

      const leaveGameResult = await leaveGame();
      if (leaveGameResult !== GameMessage.LEFT) {
        return send(reply).badRequest(leaveGameResult);
      }

      return send(reply).ok(GameMessage.LEFT);
    } catch {
      return send(reply).badRequest(GameMessage.UNKNOWN_GAME_ERROR);
    }
  });
