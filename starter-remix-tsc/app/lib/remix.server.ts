import type { DataFunctionArgs, LoaderFunction } from "@remix-run/node";
import { Context, pipe } from "effect/data";
import { Effect } from "effect/io";
import type { Codec } from "effect/schema";

export const LoaderArgs = Context.Tag<DataFunctionArgs>();

export const makeLoader: <A>(
  type: Codec.Codec<A>
) => <E>(self: Effect.Effect<DataFunctionArgs, E, A>) => LoaderFunction =
  (type) => (self) => (data) =>
    import("~/lib/runtime.server")
      .then((_) => _.deferredRuntime)
      .then(({ runtime }) =>
        runtime.unsafeRunPromise(
          pipe(
            self,
            Effect.map((a) => type.encode(a)),
            Effect.provideService(LoaderArgs)(data)
          )
        )
      );

export const requestURL = Effect.serviceWith(LoaderArgs)((_) => new URL(_.request.url));
