import type { FastifyReply, FastifyRequest } from 'fastify';

declare const guardTag: unique symbol;

export interface Guard<A extends object = object> {
  (request: FastifyRequest, reply: FastifyReply): (FastifyRequest & A) | undefined | Promise<(FastifyRequest & A) | undefined>;
  readonly [guardTag]?: 'guard';
  readonly __augmentation?: A;
}

export interface BlockingGuard<A extends object = object> {
  (
    request: FastifyRequest,
    reply: FastifyReply,
    handler: (request: FastifyRequest & A, reply: FastifyReply) => unknown | Promise<unknown>
  ): undefined | Promise<undefined>;
  readonly [guardTag]?: 'blocking';
  readonly __augmentation?: A;
}

export type GuardAugmentation<G> = G extends {
  readonly __augmentation?: infer A;
}
  ? A extends object
    ? A
    : unknown
  : unknown;

export type MergeGuardAugmentations<Guards extends readonly unknown[]> = Guards extends readonly [infer Head, ...infer Tail]
  ? GuardAugmentation<Head> & MergeGuardAugmentations<Tail>
  : unknown;
