import { runMain } from "@/lib";
import * as Effect from "npm:@effect/io/Effect";
import * as Queue from "npm:@effect/io/Queue";
import * as Duration from "npm:@fp-ts/data/Duration";
import { pipe } from "npm:@fp-ts/data/Function";

const main = pipe(
  Effect.gen(function* ($) {
    const queue = yield* $(Queue.unbounded<number>());

    yield* $(pipe(
      Effect.gen(function* ($) {
        let n = 0;
        while (true) {
          yield* $(Effect.sleep(Duration.millis(500)));
          yield* $(Queue.offer(n++)(queue));
        }
      }),
      Effect.onInterrupt(() => Effect.log("interrupted push")),
      Effect.forkScoped,
    ));

    return queue;
  }),
  Effect.flatMap((queue) =>
    pipe(
      Effect.gen(function* ($) {
        yield* $(Effect.gen(function* ($) {
          while (true) {
            const n = yield* $(Queue.take(queue));
            yield* $(Effect.log(`got: ${n}`));
          }
        }));
      }),
      Effect.onInterrupt(() => Effect.log("interrupted pull")),
    )
  ),
  Effect.scoped,
);

runMain(main);
