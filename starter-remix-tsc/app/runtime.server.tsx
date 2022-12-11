import { pipe } from "effect/data";
import { Effect, Exit, Layer, Scope } from "effect/io";
import { appLayer } from "~/layer/main";

const appRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function* ($) {
    const scope = yield* $(Scope.make());
    const env = yield* $(Layer.buildWithScope(scope)(layer));
    const runtime = yield* $(pipe(Effect.runtime<A>(), Effect.provideEnvironment(env)));

    return {
      runtime,
      clean: Scope.close(Exit.unit())(scope),
    };
  });

const runtimeSymbol = Symbol.for("@effect/examples/starter-remix-tsc/runtime");

const existing = process.listeners("beforeExit").find((listener) => runtimeSymbol in listener);

if (existing) {
  process.removeListener("beforeExit", existing);
}

export const deferredRuntime = (
  existing ? (existing as () => Promise<void>)() : Promise.resolve()
).then(() => Effect.unsafeRunPromise(appRuntime(appLayer)));

const cleanup = Object.assign(
  () =>
    Effect.unsafeRunPromise(
      pipe(
        Effect.promise(() => deferredRuntime),
        Effect.flatMap((_) => _.clean)
      )
    ),
  { [runtimeSymbol]: true }
);

// @ts-expect-error
globalThis[runtimeSymbol] = deferredRuntime;

process.on("beforeExit", cleanup);
