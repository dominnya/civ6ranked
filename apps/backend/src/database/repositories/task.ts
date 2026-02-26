import { db } from '~/database';

export interface Task {
  id: number;
  endpoint: string;
  status_code: number | null;
  payload: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  attempts: number;
  last_error: string | null;
  machine_id: number | null;
}

async function markProcessing(taskId: number): Promise<void> {
  await db`
    UPDATE task_queue
    SET status = 'processing', started_at = now(), attempts = attempts + 1
    WHERE id = ${taskId}
  `;
}

async function markCompleted(taskId: number, result: unknown, machineId?: number): Promise<void> {
  const resultJson = result === undefined ? null : JSON.stringify(result);
  await db`
    UPDATE task_queue
    SET status = 'completed', completed_at = now(), result = ${resultJson}::jsonb, machine_id = ${machineId ?? null}
    WHERE id = ${taskId}
  `;
}

async function markFailed(taskId: number, error: string, machineId?: number): Promise<void> {
  await db`
    UPDATE task_queue
    SET status = 'failed', last_error = ${error}, completed_at = now(), machine_id = ${machineId ?? null}
    WHERE id = ${taskId}
  `;
}

async function setStatusCode(taskId: number, statusCode: number): Promise<void> {
  await db`
    UPDATE task_queue
    SET status_code = ${statusCode}
    WHERE id = ${taskId}
  `;
}

async function enqueue(endpoint: string, payload: unknown): Promise<Task | null> {
  const task = await db<Task[]>`
      INSERT INTO task_queue (endpoint, payload)
      VALUES (
        ${endpoint},
        ${JSON.stringify(payload)}::jsonb
      )
      RETURNING id, status, created_at
    `;

  return task?.[0] ?? null;
}

async function getById(id: number): Promise<Task | null> {
  const task = await db<Task[]>`SELECT * FROM task_queue WHERE id = ${id}`;

  return task?.[0] ?? null;
}

export const task = {
  markProcessing,
  markCompleted,
  markFailed,
  setStatusCode,
  enqueue,
  getById,
};
