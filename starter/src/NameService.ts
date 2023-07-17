import { Effect, Layer, Context } from "effect";

export interface NameService {
  readonly getName: Effect.Effect<never, never, string>;
}

// Tag<NameService>
export const NameService = Context.Tag<NameService>();

// Layer<never, never, NameService>
export const NameServiceLive = Layer.succeed(
  NameService,
  NameService.of({
    getName: Effect.succeed("World"),
  }),
);
