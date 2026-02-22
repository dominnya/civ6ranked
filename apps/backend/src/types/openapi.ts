import type { Type } from 'arktype';

export type JsonObject = Record<string, unknown>;

export type JsonSchema = JsonObject;

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';

export type ParameterIn = 'query' | 'path' | 'header' | 'cookie';

export interface ParameterMeta {
  readonly name: string;
  readonly in: ParameterIn;
  readonly required?: boolean;
  readonly description?: string;
  readonly schema?: Type | JsonSchema;
}

export interface ResponseMeta {
  readonly description: string;
  readonly schema?: Type | JsonSchema;
}

export type SecurityRequirement = Record<string, readonly string[]>;

export interface RouteMeta {
  readonly path: string;
  readonly method: HttpMethod;
  readonly summary: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly security?: readonly SecurityRequirement[];
  readonly parameters?: readonly ParameterMeta[];
  readonly requestBody?: {
    readonly required?: boolean;
    readonly description?: string;
    readonly contentType?: string;
    readonly schema: Type | JsonSchema;
  };
  readonly responses: Readonly<Record<number, ResponseMeta>>;
}
