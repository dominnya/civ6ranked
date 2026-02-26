import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { MachineMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { send } from '~/utils/response';

const body = type({
  url: 'string',
  token: 'string',
});

const reply200 = type({
  message: "'MACHINE_CREATED'",
  machine: type({
    id: 'number.integer',
    url: 'string',
    token: 'string',
    created_at: 'string.date.iso',
    last_called_at: 'null',
    active: 'true',
    failures: '0',
  }),
});

const reply400 = type({
  message: "'VALIDATION_ERROR' | 'UNKNOWN_MACHINE_ERROR'",
});

export default define()
  .meta({
    path: '/machine',
    method: 'post',
    summary: 'Add a new machine',
    description: 'Add a new machine for running game simulations',
    tags: ['Machine'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The details of the machine to add',
      required: true,
      schema: body,
    },
    responses: {
      200: {
        description: 'Machine added',
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
    const { url, token } = request.body;

    try {
      const machine = await repo.machine.create(url, token);

      return send(reply).ok(MachineMessage.MACHINE_CREATED, { machine });
    } catch {
      return send(reply).badRequest(MachineMessage.UNKNOWN_MACHINE_ERROR);
    }
  });
