import { Effect } from "effect/io";
import { makeLoader, requestURL } from "~/runtime.server";

export const loader = makeLoader(
  Effect.gen(function* ($) {
    const { pathname } = yield* $(requestURL);

    return yield* $(
      Effect.succeed({ message: `hello world from ${pathname}` })
    );
  })
);
