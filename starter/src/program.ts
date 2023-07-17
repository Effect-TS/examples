import { Effect } from "effect";
import { NameService } from "~/NameService";

// Effect<NameService, never, void>
export const program = NameService.pipe(
  Effect.flatMap((service) => service.getName),
  Effect.flatMap((name) =>
    Effect.sync(() => {
      console.log(`Hello ${name}!`);
    }),
  ),
);
