import { existsSync, readFileSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';

import { Glob, YAML } from 'bun';

import { config } from '~/config';

import type { Type } from 'arktype';
import type { JsonObject, JsonSchema, ParameterMeta, ResponseMeta, RouteMeta } from '~/types/openapi';

export const SPEC_DIR = 'dist';
export const SPEC_PATH_JSON = 'dist/openapi.json';
export const SPEC_PATH_YAML = 'dist/openapi.yml';

export const ROUTE_META = Symbol.for('routeMeta');

export interface MetaRoute {
  [ROUTE_META]?: RouteMeta;
}

const routeRegistry: RouteMeta[] = [];

/** Registers a route's metadata for OpenAPI spec generation. */
export function registerRoute(meta: RouteMeta): void {
  routeRegistry.push(meta);
}

/** Returns all registered route metadata. */
export function getRegisteredRoutes(): readonly RouteMeta[] {
  return routeRegistry;
}

/** Checks whether a value is an arktype Type instance. */
function isArktypeType(value: unknown): value is Type {
  return value !== null && value !== undefined && typeof (value as Type).toJsonSchema === 'function';
}

/** Converts an arktype Type or plain JSON Schema to a JSON Schema object. */
function toSchema(schema: Type | JsonSchema): JsonSchema {
  if (isArktypeType(schema)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $schema: _, ...rest } = schema.toJsonSchema() as JsonSchema & { $schema?: unknown };
    return rest;
  }
  return schema;
}

/** Builds an OpenAPI parameter object from metadata. */
function buildParameter(param: ParameterMeta): JsonObject {
  return {
    name: param.name,
    in: param.in,
    required: param.required ?? param.in === 'path',
    ...(param.description ? { description: param.description } : {}),
    ...(param.schema ? { schema: toSchema(param.schema) } : {}),
  };
}

/** Builds an OpenAPI response object from metadata. */
function buildResponse(response: ResponseMeta): JsonObject {
  return {
    description: response.description,
    ...(response.schema ? { content: { 'application/json': { schema: toSchema(response.schema) } } } : {}),
  };
}

/** Builds an OpenAPI operation object from route metadata. */
function buildOperation(meta: RouteMeta): JsonObject {
  return {
    summary: meta.summary,
    ...(meta.description ? { description: meta.description } : {}),
    ...(meta.tags ? { tags: [...meta.tags] } : {}),
    ...(meta.security ? { security: meta.security.map(s => ({ ...s })) } : {}),
    ...(meta.parameters ? { parameters: meta.parameters.map(buildParameter) } : {}),
    ...(meta.requestBody
      ? {
          requestBody: {
            required: meta.requestBody.required ?? true,
            ...(meta.requestBody.description ? { description: meta.requestBody.description } : {}),
            content: {
              [meta.requestBody.contentType ?? 'application/json']: {
                schema: toSchema(meta.requestBody.schema),
              },
            },
          },
        }
      : {}),
    responses: Object.fromEntries(Object.entries(meta.responses).map(([code, response]) => [String(code), buildResponse(response)])),
  };
}

/** Builds the OpenAPI paths object from all registered routes. */
function buildPaths(): JsonObject {
  return routeRegistry.reduce<JsonObject>((paths, meta) => {
    const pathKey = meta.path.startsWith('/') ? meta.path : `/${meta.path}`;
    return {
      ...paths,
      [pathKey]: {
        ...(paths[pathKey] as JsonObject | undefined),
        [meta.method]: buildOperation(meta),
      },
    };
  }, {});
}

/** Reads and merges YAML files matching a glob pattern. */
export function defineYaml(pattern: string): JsonObject {
  const glob = new Glob(pattern);
  const yamlFiles = Array.from(glob.scanSync());
  return yamlFiles.reduce<JsonObject>((merged, fileName) => {
    const content = readFileSync(fileName, 'utf-8');
    const doc = YAML.parse(content) as JsonObject;
    return { ...merged, ...doc };
  }, {});
}

/** Builds the complete OpenAPI spec from YAML components and registered routes. */
export function buildSpec(yamlComponents: JsonObject): JsonObject {
  return {
    openapi: '3.1.0',
    info: {
      title: 'civ6ranked API',
      version: '1.0.0',
    },
    servers: [{ url: config.ownUrl }],
    paths: buildPaths(),
    ...yamlComponents,
  };
}

/** Reads the exported OpenAPI spec from disk. */
export async function getSpec(): Promise<JsonObject> {
  if (!existsSync(SPEC_PATH_JSON)) {
    throw new Error('Spec is not exported yet! Call exportSpec(spec) to export.');
  }
  return JSON.parse(await readFile(SPEC_PATH_JSON, 'utf-8')) as JsonObject;
}

/** Exports the OpenAPI spec to JSON and YAML files. */
export async function exportSpec(spec: JsonObject): Promise<void> {
  await mkdir(SPEC_DIR, { recursive: true });
  await Promise.all([writeFile(SPEC_PATH_JSON, JSON.stringify(spec)), writeFile(SPEC_PATH_YAML, YAML.stringify(spec))]);
}
