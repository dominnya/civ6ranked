import { $ } from 'bun';

export async function generateOpenApiTypes() {
  try {
    await $`openapi-typescript ../../apps/local/dist/openapi.yml -o dist/openapi.d.ts`.quiet();
    console.log('✓ Generated openapi.d.ts');
  } catch {
    console.error('✗ Failed to generate machine openapi.d.ts!');
  }
}
