import { $ } from 'bun';

export async function generateOpenApiTypes() {
  await $`openapi-typescript apps/backend/dist/openapi.yml -o apps/discord/dist/openapi.d.ts`.cwd('../..').quiet();
  console.log('✓ Generated openapi.d.ts');
}
