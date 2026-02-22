import { config } from '~/config';

import type { paths } from '~types';

type PathItem<E extends keyof paths> = paths[E];

type MethodKey<E extends keyof paths> = Extract<
  {
    [K in keyof PathItem<E>]: K extends 'parameters' ? never : PathItem<E>[K] extends { responses: unknown } ? K : never;
  }[keyof PathItem<E>],
  string
>;

type Operation<E extends keyof paths, M extends MethodKey<E>> = paths[E][M];

type QueryFor<E extends keyof paths, M extends MethodKey<E>> =
  Operation<E, M> extends {
    parameters: { query?: infer Q };
  }
    ? Q
    : never;

type BodyFor<E extends keyof paths, M extends MethodKey<E>> =
  Operation<E, M> extends {
    requestBody: { content: { 'application/json': infer B } };
  }
    ? B
    : never;

type ResponseFor<E extends keyof paths, M extends MethodKey<E>> =
  Operation<E, M> extends {
    responses: infer R;
  }
    ? R[keyof R]
    : never;

type ResponseJson<E extends keyof paths, M extends MethodKey<E>> =
  ResponseFor<E, M> extends {
    content: { 'application/json': infer C };
  }
    ? C
    : never;

type MaybeNever<T> = [T] extends [never] ? undefined : T;

type BfetchOptions<E extends keyof paths, M extends MethodKey<E>> = {
  readonly method: M;
  readonly query?: MaybeNever<QueryFor<E, M>>;
  readonly body?: MaybeNever<BodyFor<E, M>>;
  readonly init?: RequestInit;
};

function buildQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return '';

  const entries: [string, string][] = Object.entries(query).flatMap(([key, value]) => {
    if (value === undefined || value === null) return [];
    return [[key, String(value)]];
  });

  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
}

export async function bfetch<E extends keyof paths, M extends MethodKey<E>>(
  endpoint: E,
  options: BfetchOptions<E, M>
): Promise<ResponseJson<E, M>> {
  const url = `http://${config.serviceHost}:${config.servicePort}${config.servicePrefix}${endpoint}${buildQuery(
    options.query as Record<string, unknown> | undefined
  )}`;

  const headers = new Headers(options.init?.headers);
  if (config.serviceToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${config.serviceToken}`);
  }

  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options.init,
    method: options.method,
    headers,
    body,
  });

  return (await response.json()) as ResponseJson<E, M>;
}
