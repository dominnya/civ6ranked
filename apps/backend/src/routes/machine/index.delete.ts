import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { MachineMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const body = type({
  id: 'number.integer',
});

const reply200 = type({
  message: "'MACHINE_DELETED'",
});

const reply400 = type({
  message: "'VALIDATION_ERROR' | 'UNKNOWN_MACHINE_ERROR'",
});

export default define()
  .meta({
    path: '/machine',
    method: 'delete',
    summary: 'Delete a machine',
    description: 'Delete a machine',
    tags: ['Machine'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The details of the machine to delete',
      required: true,
      schema: body,
    },
    responses: {
      200: {
        description: 'Machine deleted',
        schema: reply200,
      },
      400: {
        description: 'Bad request',
        schema: reply400,
      },
    },
  })
  .guard([serviceAuth, validate({ body })])
  .handle<{
    Body: typeof body.infer;
    Reply: typeof reply200.infer | typeof reply400.infer;
  }>(async (request, reply) => {
    const { id } = request.body;

    try {
      await repo.machine.delete(id);
      return send(reply).ok(MachineMessage.MACHINE_DELETED);
    } catch {
      return send(reply).badRequest(MachineMessage.UNKNOWN_MACHINE_ERROR);
    }
  });
