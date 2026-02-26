import { type } from 'arktype';

import { repo } from '~/database/repositories';
import { TaskMessage, ValidationMessage } from '~/types/response';
import { send } from '~/utils/response';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { BlockingGuard } from '~/types/middleware';

const query = type({
  task_id: 'string.integer',
});

export const queueResult: BlockingGuard = async (request: FastifyRequest, reply: FastifyReply): Promise<undefined> => {
  const reqQuery = query(request.query);
  if (reqQuery instanceof type.errors) {
    send(reply).badRequest(ValidationMessage.VALIDATION_ERROR, reqQuery.summary);
    return undefined;
  }

  const task = await repo.task.getById(Number(reqQuery.task_id));

  if (!task) {
    send(reply).notFound(TaskMessage.TASK_NOT_FOUND);
    return undefined;
  }

  const { status, result } = task;

  if (status === 'completed' && result) {
    send(reply).ok(TaskMessage.TASK_STATUS, JSON.parse(result));
    return undefined;
  }

  send(reply).ok(TaskMessage.TASK_STATUS, { summary: status });
  return undefined;
};
