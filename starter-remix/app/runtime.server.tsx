import { pipe, Context, Effect, Layer, Scope, Exit, Runtime } from "effect";
import type {
  LoaderFunction,
  DataFunctionArgs as RemixDataFunctionArgs,
} from "@remix-run/node";
import { appLayer } from "~/layer/main.server";

const appRuntime = <A, E, R>(layer: Layer.Layer<A, E, R>) =>
  Effect.gen(function* ($) {
    const scope = yield* $(Scope.make());
    const env = yield* $(Layer.buildWithScope(scope)(layer));
    const runtime = yield* $(pipe(Effect.runtime<A>(), Effect.provide(env)));

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit),
    };
  });

const cleanupSymbol = Symbol.for(
  "@effect/examples/starter-remix/runtime/cleanup"
);

const existing = process
  .listeners("beforeExit")
  .find((listener) => cleanupSymbol in listener);

if (existing) {
  process.removeListener("beforeExit", existing);
}

const runtime = (
  existing ? (existing as () => Promise<void>)() : Promise.resolve()
).then(() => Effect.runPromise(appRuntime(appLayer)));

const cleanup = Object.assign(
  () =>
    Effect.runPromise(
      pipe(
        Effect.promise(() => runtime),
        Effect.flatMap((_) => _.clean)
      )
    ),
  { [cleanupSymbol]: true }
);

process.on("beforeExit", cleanup);

export const LoaderArgs = Context.GenericTag<RemixDataFunctionArgs>(
  "@remix/RemixDataFunctionArgs"
);

export const makeLoader = <A, E>(
  self: Effect.Effect<
    A,
    E,
    typeof appLayer extends Layer.Layer<any, any, infer R>
      ? R | RemixDataFunctionArgs
      : RemixDataFunctionArgs
  >
): LoaderFunction => {
  return (data) =>
    runtime.then((_) =>
      Runtime.runPromise(_.runtime)(
        Effect.provideService(LoaderArgs, data)(self)
      )
    );
};

export const requestURL = Effect.map(LoaderArgs, (_) => new URL(_.request.url));
