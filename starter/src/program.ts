import { Effect } from "effect";
import { NameService } from "~/services/name";

export const program = Effect.gen(function* ($) {
  const { getName } = yield* $(NameService);

  yield* $(Effect.log(`Hello ${yield* $(getName)}`));
  yield* $(Effect.die("Boom!"));
});
