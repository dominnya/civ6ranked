import { $ } from 'bun';

import { config } from '~/config';

export async function generateOpenApiTypes() {
  const machineOpenApi = `http://${config.machineHost}:${config.machinePort}${config.machinePrefix}/openapi/yaml`;
  try {
    await $`openapi-typescript ${machineOpenApi} -o dist/openapi.d.ts`.quiet();
    console.log('✓ Generated openapi.d.ts');
  } catch {
    console.error('✗ Failed to generate machine openapi.d.ts!');
  }
}
