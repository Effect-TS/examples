import * as Effect from "npm:@effect/io/Effect";

const main = Effect.gen(function* ($) {
  yield* $(Effect.log("Hello"));
  yield* $(Effect.log("World"));
});

Effect.unsafeFork(main);
