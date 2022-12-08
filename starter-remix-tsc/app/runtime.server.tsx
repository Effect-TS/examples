import { Effect, Layer, Scope, Exit } from "effect/io";
import { pipe, Context } from "effect/data";
import type {
  LoaderFunction,
  DataFunctionArgs as RemixDataFunctionArgs,
  DataFunctionArgs,
} from "@remix-run/node";
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

const cleanupSymbol = Symbol.for(
  "@effect/examples/starter-remix-tsc/runtime/cleanup"
);

const existing = process
  .listeners("beforeExit")
  .find((listener) => cleanupSymbol in listener);

if (existing) {
  process.removeListener("beforeExit", existing);
}

const runtime = (
  existing ? (existing as () => Promise<void>)() : Promise.resolve()
).then(() => Effect.unsafeRunPromise(appRuntime(appLayer)));

const cleanup = Object.assign(
  () =>
    Effect.unsafeRunPromise(
      pipe(
        Effect.promise(() => runtime),
        Effect.flatMap((_) => _.clean)
      )
    ),
  { [cleanupSymbol]: true }
);

process.on("beforeExit", cleanup);

export const LoaderArgs = Context.Tag<RemixDataFunctionArgs>();

export const makeLoader =
  (data: DataFunctionArgs) =>
  <E, A>(
    self: Effect.Effect<
      typeof appLayer extends Layer.Layer<any, any, infer R>
        ? R | RemixDataFunctionArgs
        : RemixDataFunctionArgs,
      E,
      A
    >
  ): ReturnType<LoaderFunction> => {
    return runtime.then((_) =>
      _.runtime.unsafeRunPromise(
        pipe(self, Effect.provideService(LoaderArgs)(data))
      )
    );
  };

export const requestURL = Effect.serviceWith(LoaderArgs)(
  (_) => new URL(_.request.url)
);
