import { define as storonaDefine } from '@storona/discord.js';

import type { ChatInputCommandInteraction, ClientEvents } from 'discord.js';
import type { SnakeCaseFrom } from 'storona/adapter';
import type { BlockingGuard, Guard, MergeGuardAugmentations } from '~/types/middleware';

type SnakeEvents = {
  [K in keyof ClientEvents as SnakeCaseFrom.Camel<K>]: ClientEvents[K];
};

type Events = keyof SnakeEvents;
type CommandMethod = 'command';
type MethodType = Events | CommandMethod;

type EventHandlers = {
  [K in Events]: (...args: SnakeEvents[K]) => unknown | Promise<unknown>;
};

type CommandHandler = (interaction: ChatInputCommandInteraction) => unknown | Promise<unknown>;

type Handler<Q extends MethodType = MethodType> = Q extends CommandMethod ? CommandHandler : Q extends Events ? EventHandlers[Q] : never;

type HandlerArgs<Q extends MethodType> = Parameters<Handler<Q>>;
type ContextArg<Q extends MethodType> = HandlerArgs<Q> extends [infer First, ...unknown[]] ? First : never;
type RestArgs<Q extends MethodType> = HandlerArgs<Q> extends [unknown, ...infer Rest] ? Rest : [];

type DiscordGuard<Augmentation extends object, Q extends MethodType> = Guard<Augmentation, ContextArg<Q>>;
type DiscordBlockingGuard<Augmentation extends object, Q extends MethodType> = BlockingGuard<Augmentation, ContextArg<Q>>;

interface HandleBuilder<Augmentation, Q extends MethodType> {
  handle: (handler: (context: ContextArg<Q> & Augmentation, ...args: RestArgs<Q>) => unknown | Promise<unknown>) => Handler<Q>;
}

interface GuardableBuilder<Augmentation, Q extends MethodType> extends HandleBuilder<Augmentation, Q> {
  guard: {
    <const Guards extends readonly DiscordGuard<object, Q>[]>(
      guards: [...Guards]
    ): HandleBuilder<Augmentation & MergeGuardAugmentations<Guards>, Q>;
    <const Guards extends readonly [...DiscordGuard<object, Q>[], DiscordBlockingGuard<object, Q>]>(
      guards: [...Guards]
    ): HandleBuilder<Augmentation & MergeGuardAugmentations<Guards>, Q>;
  };
}

export function define<Q extends MethodType = MethodType>(): GuardableBuilder<unknown, Q> {
  const createBuilder = (guards: readonly (DiscordGuard<object, Q> | DiscordBlockingGuard<object, Q>)[]): GuardableBuilder<unknown, Q> => {
    const buildRoute = (handler: (context: ContextArg<Q>, ...args: RestArgs<Q>) => unknown): Handler<Q> => {
      const lastGuard = guards[guards.length - 1];
      const hasBlockingGuard = lastGuard !== undefined && lastGuard.length === 2;
      const nonBlockingGuards = hasBlockingGuard ? guards.slice(0, -1) : guards;

      return storonaDefine<Q>((async (...args: HandlerArgs<Q>) => {
        const [context, ...rest] = args;
        const current = await nonBlockingGuards.reduce<Promise<ContextArg<Q> | undefined>>(
          async (accPromise, guard) => {
            const acc = await accPromise;
            return acc ? (guard as DiscordGuard<object, Q>)(acc) : undefined;
          },
          Promise.resolve(context as ContextArg<Q> | undefined)
        );
        if (!current) return;
        if (hasBlockingGuard) {
          return (lastGuard as DiscordBlockingGuard<object, Q>)(current, ctx => handler(ctx, ...(rest as RestArgs<Q>)));
        }
        return handler(current, ...(rest as RestArgs<Q>));
      }) as Handler<Q>);
    };

    const handleBuilder: HandleBuilder<unknown, Q> = {
      handle: handler => buildRoute(handler),
    };

    return {
      ...handleBuilder,
      guard: ((items: readonly (DiscordGuard<object, Q> | DiscordBlockingGuard<object, Q>)[]) => createBuilder(items)) as GuardableBuilder<
        unknown,
        Q
      >['guard'],
    };
  };

  return createBuilder([]);
}
