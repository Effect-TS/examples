import { Cause, Context, Effect, Exit, Layer, Logger, pipe } from "effect";

export interface Name {
  getName: Effect.Effect<never, never, string>;
}

export const Name: Context.Tag<Name> = Context.Tag<Name>();

export const program: Effect.Effect<Name, never, void> = Effect.gen(function* ($) {
  const { getName } = yield* $(Effect.service(Name));

  yield* $(Effect.log(`Hello ${yield* $(getName)}`));
  yield* $(Effect.die("Error"));
});

export const NameLive: Layer.Layer<never, never, Name> = Layer.fromEffect(Name)(
  Effect.sync(() => ({
    getName: Effect.succeed("Mike"),
  }))
);

pipe(
  program,
  Effect.provideLayer(NameLive),
  Effect.tapErrorCause(Effect.logErrorCause),
  Effect.provideLayer(Logger.console()),
  Effect.unsafeFork
);
