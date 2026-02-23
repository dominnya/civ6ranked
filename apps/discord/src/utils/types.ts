import { $ } from 'bun';

import { config } from '~/config';

export async function generateOpenApiTypes() {
  const rankingOpenApi = `${config.serviceUrl}/openapi/yaml`;
  try {
    await $`openapi-typescript ${rankingOpenApi} -o dist/openapi.d.ts`.quiet();
    console.log('✓ Generated openapi.d.ts');
  } catch {
    console.error('✗ Failed to generate ranking openapi.d.ts!');
  }
}
