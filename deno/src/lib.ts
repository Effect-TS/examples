import * as Cause from 'npm:@effect/io/Cause';
import * as Effect from 'npm:@effect/io/Effect';
import * as Fiber from 'npm:@effect/io/Fiber';
import * as Exit from 'npm:@effect/io/Exit';
import * as Logger from 'npm:@effect/io/Logger';
import * as Layer from 'npm:@effect/io/Layer';
import { pipe } from 'npm:@fp-ts/data/Function';

export const runMain = <E, A>(effect: Effect.Effect<never, E, A>) => {
  let interrupt = false;

  const fiber = pipe(
    effect,
    Effect.matchCauseEffect(
      (cause) =>
        Cause.isInterruptedOnly(cause)
          ? Effect.unit()
          : Effect.logErrorCause(cause),
      () => Effect.unit(),
    ),
    Effect.traced(void 0),
    Effect.provideSomeLayer(
      Deno.env.get('LOGGER') === 'LOGFMT'
        ? Logger.logFmt
        : Layer.environment<never>(),
    ),
    Effect.unsafeFork,
  );

  fiber.unsafeAddObserver((exit) => {
    if (!interrupt) {
      if (Exit.isFailure(exit) && !Cause.isInterruptedOnly(exit.cause)) {
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
        Effect.flatMap(
          (exit) =>
            Exit.isFailure(exit)
              ? (Cause.isInterruptedOnly(exit.cause) ? Effect.unit() : pipe(
                Effect.logErrorCause(exit.cause),
                Effect.flatMap(() => Effect.failCause(exit.cause)),
              ))
              : Exit.succeed(exit.value),
        ),
        Effect.provideSomeLayer(Logger.logFmt),
        Effect.unsafeFork,
      ).unsafeAddObserver((exit) => {
        if (Exit.isFailure(exit) && !Cause.isInterruptedOnly(exit.cause)) {
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
