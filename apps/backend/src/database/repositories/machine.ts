import { db } from '~/database';

export interface Machine {
  id: number;
  url: string;
  active: boolean;
  failures: number;
  token: string;
}

async function create(url: string, token: string): Promise<Machine> {
  const machines = await db<Machine[]>`
    INSERT INTO machine (url, token)
    VALUES (${url}, ${token})
    RETURNING *
  `;
  return machines[0];
}

async function deleteMachine(id: number): Promise<void> {
  await db`
    DELETE FROM machine
    WHERE id = ${id}
  `;
}

async function getAvailable(): Promise<Machine | null> {
  const machines = await db<Machine[]>`
    SELECT * FROM machine
    WHERE active = true
    ORDER BY failures ASC, last_called_at ASC NULLS FIRST
    LIMIT 1
  `;
  return machines[0] || null;
}

async function getById(id: number): Promise<Machine | null> {
  const machines = await db<Machine[]>`
    SELECT * FROM machine
    WHERE id = ${id}
  `;
  return machines[0] || null;
}

export const machine = {
  getAvailable,
  getById,
  create,
  delete: deleteMachine,
};
