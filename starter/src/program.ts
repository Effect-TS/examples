import { Effect } from "effect";
import { NameService } from "~/NameService";

// Effect<NameService, never, void>
export const program = Effect.gen(function* (_) {
  const service = yield* _(NameService);
  const name = yield* _(service.getName);
  console.log(`Hello ${name}!`);
});
