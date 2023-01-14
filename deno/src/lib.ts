import * as Cause from 'npm:@effect/io/Cause';
import * as Effect from 'npm:@effect/io/Effect';
import * as Fiber from 'npm:@effect/io/Fiber';
import { pipe } from 'npm:@fp-ts/data/Function';

export const runMain = <E, A>(effect: Effect.Effect<never, E, A>) => {
  const fiber = Effect.unsafeFork(effect);

  Deno.addSignalListener(
    'SIGINT',
    () =>
      pipe(
        Fiber.interrupt(fiber),
        Effect.flatten,
        Effect.matchCauseEffect(
          (cause) =>
            Cause.isInterruptedOnly(cause)
              ? Effect.unit()
              : Effect.failCause(cause),
          () => Effect.unit(),
        ),
        Effect.unsafeRunPromise,
      ),
  );
};

export * as Queue from 'npm:@effect/io/Queue';
export * as Duration from 'npm:@fp-ts/data/Duration';
export * as Effect from 'npm:@effect/io/Effect';
export { pipe } from 'npm:@fp-ts/data/Function';
