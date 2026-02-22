import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { GameMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const FinishRequestBody = type({
  id: 'number',
});

const FinishReply = type({
  message: "'FINISHED'",
  match_result_id: 'number',
  finished_at: 'string.date.iso',
});

const FinishError = type({
  message: "'UNKNOWN_GAME_ERROR' | 'NOT_IN_GAME'",
});

export default define()
  .meta({
    path: '/game',
    method: 'delete',
    summary: 'Finish a game',
    description: 'Finishes a game with the given ID',
    tags: ['Game'],
    requestBody: {
      description: 'The ID of the game to finish',
      required: true,
      schema: FinishRequestBody,
    },
    responses: {
      200: {
        description: 'Successfully finished the game',
        schema: FinishReply,
      },
      400: {
        description: 'Bad request',
        schema: FinishError,
      },
    },
  })
  .guard([serviceAuth, validate({ body: FinishRequestBody })])
  .handle<{
    Body: typeof FinishRequestBody.infer;
    Reply: typeof FinishReply.infer;
  }>(async (request, reply) => {
    try {
      const { match_result_id, finished_at } = await repo.game.finish(request.body.id);
      return send(reply).ok<Omit<typeof FinishReply.infer, 'message'>>(GameMessage.FINISHED, { match_result_id, finished_at });
    } catch (error) {
      return send(reply).badRequest(error as GameMessage);
    }
  });
