import * as Effect from "npm:@effect/io/Effect";

const main = Effect.gen(function* ($) {
  yield* $(Effect.log("hello"));
  yield* $(Effect.log("world"));
});

Effect.unsafeFork(main);
