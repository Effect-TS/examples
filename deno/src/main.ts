import { Duration, Effect, pipe, Queue, runMain } from '@/lib';

const main = pipe(
  Effect.gen(function* ($) {
    const queue = yield* $(Queue.unbounded<number>());

    yield* $(pipe(
      Effect.gen(function* ($) {
        yield* $(Effect.gen(function* ($) {
          while (true) {
            const n = yield* $(Queue.take(queue));
            yield* $(
              Effect.fiberIdWith((id) =>
                Effect.log(`got: ${n} (fiber #${id.id})`)
              ),
            );
          }
        }));
      }),
      Effect.onInterrupt(() =>
        Effect.fiberIdWith((id) =>
          Effect.log(`interrupted pull (fiber #${id.id})`)
        )
      ),
      Effect.forkScoped,
      Effect.repeatN(2),
    ));

    return queue;
  }),
  Effect.flatMap((queue) =>
    pipe(
      Effect.gen(function* ($) {
        let n = 0;
        while (true) {
          yield* $(Effect.sleep(Duration.millis(500)));
          yield* $(Queue.offer(n++)(queue));
        }
      }),
      Effect.onInterrupt(() =>
        Effect.fiberIdWith((id) =>
          Effect.log(`interrupted push (fiber #${id.id})`)
        )
      ),
    )
  ),
  Effect.scoped,
);

runMain(main);
