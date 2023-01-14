import * as Cause from 'npm:@effect/io/Cause';
import * as Effect from 'npm:@effect/io/Effect';
import * as Fiber from 'npm:@effect/io/Fiber';
import * as Exit from 'npm:@effect/io/Exit';
import { pipe } from 'npm:@fp-ts/data/Function';
import { millis } from 'npm:@fp-ts/data/Duration';

export const runMain = <E, A>(effect: Effect.Effect<never, E, A>) => {
  let interrupt = false;

  const fiber = pipe(
    effect,
    Effect.matchCauseEffect(
      (cause) =>
        Cause.isInterruptedOnly(cause) ? Effect.unit() : pipe(
          Effect.logErrorCause(cause),
          Effect.flatMap(() => Effect.failCause(cause)),
        ),
      () => Effect.unit(),
    ),
    Effect.unsafeFork,
  );

  fiber.unsafeAddObserver((exit) => {
    if (!interrupt) {
      if (Exit.isFailure(exit)) {
        Deno.exit(1);
      } else {
        Deno.exit(0);
      }
    }
  });

  Deno.addSignalListener(
    'SIGINT',
    () => {
      interrupt = true;
      pipe(
        Fiber.interrupt(fiber),
        Effect.flatten,
        Effect.unsafeFork,
      ).unsafeAddObserver((exit) => {
        if (Exit.isFailure(exit)) {
          Deno.exit(1);
        } else {
          Deno.exit(0);
        }
      });
    },
  );
};

export * as Exit from 'npm:@effect/io/Exit';
export * as Queue from 'npm:@effect/io/Queue';
export * as Duration from 'npm:@fp-ts/data/Duration';
export * as Effect from 'npm:@effect/io/Effect';
export { pipe } from 'npm:@fp-ts/data/Function';
