import type { DataFunctionArgs, LoaderFunction } from "@remix-run/node";
import { useLoaderData as useLoaderDataRemix } from "@remix-run/react";
import { Context, pipe } from "effect/data";
import { Effect } from "effect/io";
import type { Codec } from "effect/schema";

export { Chunk } from "effect/collection";
export { pipe } from "effect/data";
export { Effect } from "effect/io";
export { Codec } from "effect/schema";

export const LoaderArgs = Context.Tag<DataFunctionArgs>();

export const makeLoader: <A>(
  type: Codec.Codec<A>
) => <E>(self: Effect.Effect<DataFunctionArgs, E, A>) => LoaderFunction =
  (type) => (self) => (data) =>
    import("~/utils.server")
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

export const requestURL = Effect.serviceWith(LoaderArgs)(
  (_) => new URL(_.request.url)
);

export const useLoaderData = <A,>(type: Codec.Codec<A>) => {
  const data = useLoaderDataRemix();
  const parsed = type.decode(data);
  if (parsed._tag === "Left") {
    throw new Error(JSON.stringify(parsed.left));
  }
  return parsed.right;
};
