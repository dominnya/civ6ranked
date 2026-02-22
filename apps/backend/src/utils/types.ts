import { $ } from 'bun';

export async function generateOpenApiTypes() {
  await $`openapi-typescript apps/local/dist/openapi.yml -o apps/backend/dist/openapi.d.ts`.cwd('../..').quiet();
  console.log('✓ Generated openapi.d.ts');
}
