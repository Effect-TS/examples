import { Effect, Layer, Context } from "effect";

export interface NameService {
  readonly getName: Effect.Effect<string>;
}

// Tag<NameService>
export const NameService = Context.GenericTag<NameService>('@services/NameService');

// Layer<never, never, NameService>
export const NameServiceLive = Layer.succeed(
  NameService,
  NameService.of({
    getName: Effect.succeed("World"),
  }),
);
