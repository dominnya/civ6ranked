import { define as storonaDefine } from '@storona/fastify';

import { ROUTE_META, registerRoute } from '~/utils/openapi';

import type { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify';
import type { BlockingGuard, Guard, MergeGuardAugmentations } from '~/types/middleware';
import type { RouteMeta } from '~/types/openapi';
import type { MetaRoute } from '~/utils/openapi';

interface HandleBuilder<Augmentation> {
  handle: <RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    handler: (request: FastifyRequest<RouteGeneric> & Augmentation, reply: FastifyReply) => unknown | Promise<unknown>
  ) => ReturnType<typeof storonaDefine<RouteGeneric>>;
}

interface GuardableBuilder<Augmentation> extends HandleBuilder<Augmentation> {
  guard: {
    <const Guards extends readonly Guard[]>(guards: [...Guards]): HandleBuilder<Augmentation & MergeGuardAugmentations<Guards>>;
    <const Guards extends readonly [...Guard[], BlockingGuard]>(
      guards: [...Guards]
    ): HandleBuilder<Augmentation & MergeGuardAugmentations<Guards>>;
  };
}

interface MetaBuilder<Augmentation> extends GuardableBuilder<Augmentation> {
  meta: (meta: RouteMeta) => GuardableBuilder<Augmentation>;
}

/** Creates a fluent route builder: define().meta().guard().handle(). */
export function define(): MetaBuilder<unknown> {
  const createBuilder = (routeMeta: RouteMeta | undefined, guards: readonly (Guard | BlockingGuard)[]): MetaBuilder<unknown> => {
    const buildRoute = (handler: (request: FastifyRequest, reply: FastifyReply) => unknown): ReturnType<typeof storonaDefine> => {
      const lastGuard = guards[guards.length - 1];
      const hasBlockingGuard = lastGuard !== undefined && lastGuard.length === 3;
      const nonBlockingGuards = hasBlockingGuard ? guards.slice(0, -1) : guards;

      const route = storonaDefine((async (request: FastifyRequest, reply: FastifyReply) => {
        const current = await nonBlockingGuards.reduce<Promise<FastifyRequest | undefined>>(
          async (accPromise, guard) => {
            const acc = await accPromise;
            return acc ? (guard as Guard)(acc, reply) : undefined;
          },
          Promise.resolve(request as FastifyRequest | undefined)
        );
        if (!current) return;

        if (hasBlockingGuard) {
          return (lastGuard as BlockingGuard)(current, reply, (req, rep) => handler(req, rep));
        }
        return handler(current, reply);
      }) as Parameters<typeof storonaDefine>[0]);

      if (routeMeta) {
        (route as unknown as MetaRoute)[ROUTE_META] = routeMeta;
        registerRoute(routeMeta);
      }
      return route;
    };

    const handleBuilder: HandleBuilder<unknown> = {
      handle: ((handler: (request: FastifyRequest, reply: FastifyReply) => unknown) =>
        buildRoute(handler)) as HandleBuilder<unknown>['handle'],
    };

    const guardableBuilder: GuardableBuilder<unknown> = {
      ...handleBuilder,
      guard: ((items: readonly (Guard | BlockingGuard)[]) => createBuilder(routeMeta, items)) as GuardableBuilder<unknown>['guard'],
    };

    return {
      ...guardableBuilder,
      meta(meta: RouteMeta) {
        return createBuilder(meta, guards);
      },
    };
  };

  return createBuilder(undefined, []);
}
