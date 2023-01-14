import { Duration, Effect, pipe, Queue, runMain } from '@/lib';

const pull = (queue: Queue.Queue<number>) =>
  pipe(
    Effect.gen(function* ($) {
      while (true) {
        const n = yield* $(Queue.take(queue));
        yield* $(Effect.log(`got: ${n}`));
      }
    }),
    Effect.onInterrupt(() => Effect.log(`interrupted pull`)),
  );

const push = (queue: Queue.Queue<number>) =>
  pipe(
    Effect.gen(function* ($) {
      let n = 0;
      while (true) {
        yield* $(Effect.sleep(Duration.millis(500)));
        yield* $(Queue.offer(n++)(queue));

        if (n > 6) {
          yield* $(Effect.die('boom'));
        }
      }
    }),
    Effect.onInterrupt(() => Effect.log(`interrupted push`)),
  );

const main = Effect.gen(function* ($) {
  const queue = yield* $(Queue.unbounded<number>());

  for (let i = 0; i < 3; i++) {
    yield* $(Effect.fork(pull(queue)));
  }

  return yield* $(push(queue));
});

runMain(main);
