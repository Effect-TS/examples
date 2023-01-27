import { Effect } from "~/lib";
import { NameService } from "~/services/name";

export const program = Effect.gen(function* ($) {
  const { getName } = yield* $(Effect.service(NameService));

  yield* $(Effect.log(`Hello ${yield* $(getName)}`));
  yield* $(Effect.die("Boom!"));
});
