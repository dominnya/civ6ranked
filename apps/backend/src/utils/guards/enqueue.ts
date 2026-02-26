import { repo } from '~/database/repositories';
import { TaskMessage } from '~/types/response';
import { send } from '~/utils/response';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { BlockingGuard } from '~/types/middleware';

export interface TaskContext {
  readonly taskId: number;
  setMachineId(id: number): void;
}

function spawnTask(taskId: number, handler: (context: TaskContext) => Promise<unknown>): void {
  void (async () => {
    let machineId: number | undefined;
    const taskContext: TaskContext = {
      taskId,
      setMachineId: (id: number) => {
        machineId = id;
      },
    };

    try {
      await repo.task.markProcessing(taskId);
      const result = (await handler(taskContext)) as QueueResponse | unknown;

      if (result instanceof QueueResponse) {
        repo.task.setStatusCode(taskId, result.statusCode);
        await repo.task.markCompleted(taskId, result.body, machineId);
      } else {
        await repo.task.markCompleted(taskId, result, machineId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await repo.task.markFailed(taskId, message, machineId).catch(() => {});
    }
  })();
}

class QueueResponse {
  constructor(
    public readonly statusCode: number,
    public readonly body: Record<string, unknown>
  ) {}
}

export function queueResponse(code: number, data?: Record<string, unknown>): QueueResponse {
  return new QueueResponse(code, data ?? {});
}

/** Creates a blocking guard that enqueues a task and spawns the handler in the background. */
export const enqueue: BlockingGuard<{ readonly task: TaskContext }> = async (
  request: FastifyRequest,
  reply: FastifyReply,
  handler: (request: FastifyRequest & { readonly task: TaskContext }, reply: FastifyReply) => unknown | Promise<unknown>
): Promise<undefined> => {
  const payload = request.body ?? {};

  const row = await repo.task.enqueue(request.url, payload);
  if (!row) {
    send(reply).internalError(TaskMessage.TASK_ENQUEUE_FAILED);
    return undefined;
  }

  spawnTask(row.id, async context => {
    const augmentedRequest = Object.assign(request, { task: context }) as FastifyRequest & { readonly task: TaskContext };
    const result = await handler(augmentedRequest, reply);
    return result;
  });

  send(reply).status(202, TaskMessage.TASK_ACCEPTED, {
    task_id: row.id,
    status: row.status,
    created_at: row.created_at,
  });

  return undefined;
};
