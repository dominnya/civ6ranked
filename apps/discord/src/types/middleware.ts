declare const guardTag: unique symbol;

export interface Guard<A extends object = object, Context = unknown> {
  (context: Context): (Context & A) | undefined | Promise<(Context & A) | undefined>;

  readonly [guardTag]?: 'guard';
  readonly __augmentation?: A;
}

export interface BlockingGuard<A extends object = object, Context = unknown> {
  (context: Context, handler: (context: Context & A) => unknown | Promise<unknown>): undefined | Promise<undefined>;

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
