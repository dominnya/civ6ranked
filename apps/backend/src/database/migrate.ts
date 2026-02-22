import { readFileSync } from 'fs';
import { resolve } from 'path';

import { Glob } from 'bun';

import { config } from '~/config';
import { db } from '~/database';

const MIGRATIONS_DIR = resolve('src/database/migrations');

async function setDatabaseGuc(name: string, value: string): Promise<void> {
  const url = new URL(config.databaseUrl);
  const dbName = url.pathname.replace(/^\//, '');
  const escapedValue = value.replace(/'/g, "''");

  try {
    await db.unsafe(`ALTER DATABASE "${dbName}" SET ${name} = '${escapedValue}'`);
  } catch {
    const rows = (await db`SELECT current_user AS name`) as { name: string }[];
    const roleName = rows[0]?.name ?? '';

    if (!roleName) throw new Error(`Failed to resolve current_user for ${name}`);

    try {
      await db.unsafe(`ALTER ROLE "${roleName}" SET ${name} = '${escapedValue}'`);
    } catch {
      throw new Error(`Failed to persist ${name} via ALTER DATABASE or ALTER ROLE`);
    }
  }
}

async function injectServiceTokenGuc(): Promise<void> {
  const token = String(config.serviceToken ?? '');
  await setDatabaseGuc('app.service_token', token);
}

async function ensureMigrationsTable(): Promise<void> {
  await db`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = (await db`SELECT name FROM _migrations ORDER BY name`) as {
    name: string;
  }[];
  return new Set(rows.map(row => row.name));
}

function discoverMigrations(): string[] {
  const glob = new Glob('*.sql');
  const files = Array.from(glob.scanSync({ cwd: MIGRATIONS_DIR }));
  return files.sort();
}

async function migrate(): Promise<void> {
  await injectServiceTokenGuc();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const allMigrations = discoverMigrations();
  const pending = allMigrations.filter(name => !applied.has(name));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await db.close();
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):`);

  for (const name of pending) {
    const filePath = resolve(MIGRATIONS_DIR, name);
    const sqlContent = readFileSync(filePath, 'utf-8');

    console.log(`  ↑ Applying ${name}...`);

    await db.begin(async tx => {
      await tx.unsafe(sqlContent);
      await tx`INSERT INTO _migrations (name) VALUES (${name})`;
    });

    console.log(`  ✓ Applied ${name}`);
  }

  console.log('All migrations applied successfully.');
  await db.close();
}

migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
