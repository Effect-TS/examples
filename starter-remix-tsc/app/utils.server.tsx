import type { DataFunctionArgs } from "@remix-run/node";
import { Context, pipe } from "effect/data";
import { Effect, Exit, Layer, Scope } from "effect/io";
import type { Codec } from "effect/schema";
import { appLayer } from "~/layer/main";

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

export const LoaderArgs = Context.Tag<DataFunctionArgs>();

export const makeLoader: <A>(
  type: Codec.Codec<A>
) => <E>(
  self: Effect.Effect<DataFunctionArgs, E, A>
) => (data: DataFunctionArgs) => Promise<unknown> =
  (type) => (self) => (data: DataFunctionArgs) =>
    runtime.then((_) =>
      _.runtime.unsafeRunPromise(
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
