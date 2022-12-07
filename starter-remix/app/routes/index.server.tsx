import { Effect } from "~/effect.server";
import { makeLoader, requestURL } from "~/runtime.server";

export const loader = makeLoader(
  Effect.gen(function* ($) {
    const { pathname, searchParams } = yield* $(requestURL);

    return yield* $(
      Effect.succeed({
        message: `hello world from ${pathname} (search: ${searchParams})`,
      })
    );
  })
);
