import { Effect, Layer, Scope, pipe, Exit, Context } from "~/effect.server";
import type { LoaderFunction, DataFunctionArgs as RemixDataFunctionArgs } from "@remix-run/node";
import { appLayer } from "~/layer/main.server";

const appRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function* ($) {
    const scope = yield* $(Scope.make());
    const env = yield* $(Layer.buildWithScope(scope)(layer));
    const runtime = yield* $(
      pipe(Effect.runtime<A>(), Effect.provideEnvironment(env))
    );

    return {
      runtime,
      clean: Scope.close(Exit.unit())(scope),
    };
  });

const runtime = Effect.unsafeRunPromise(appRuntime(appLayer));

process.on("beforeExit", () => Effect.unsafeRunPromise(pipe(
  Effect.promise(() => runtime),
  Effect.flatMap((_) => _.clean)
)))

export const LoaderArgs = Context.Tag<RemixDataFunctionArgs>()

export const makeLoader = <E, A>(
  self: Effect.Effect<
    typeof appLayer extends Layer.Layer<any, any, infer R> ? R | RemixDataFunctionArgs : RemixDataFunctionArgs,
    E,
    A
  >
): LoaderFunction => {
  return (data) =>
    runtime.then((_) => _.runtime.unsafeRunPromise(pipe(self, Effect.provideService(LoaderArgs)(data))));
};

export const requestURL = Effect.serviceWith(LoaderArgs)((_) => new URL(_.request.url))