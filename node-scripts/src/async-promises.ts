import { runMain } from '@effect/platform-node/NodeRuntime'
import { Duration, Effect } from 'effect'
import { TaggedClass } from 'effect/Data'

// --- HELPERS ---

const getMagicNumber = async () => {
  await sleep(200)

  return 42
}

const throwSomeError = async () => {
  throw new Error('some error')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class MyCustomError extends TaggedClass('MyCustomError')<{ readonly cause: unknown }> {}

const someEffect = Effect.succeed(69).pipe(Effect.delay(Duration.seconds(0.5)))

const someAsyncFnRunningAnEffect = async () => {
  const result = await Effect.runPromise(someEffect)

  return result
}

// --- MAIN ---

const main = Effect.gen(function* ($) {
  // calling a async function/promise from Effect
  const result1 = yield* $(Effect.promise(() => getMagicNumber()))

  console.log('Got result 1:', result1)

  // calling a async function/promise from Effect (with error handling)
  const result2 = yield* $(
    Effect.tryPromise({ try: () => throwSomeError(), catch: (cause) => new MyCustomError({ cause }) }),
    Effect.catchTag('MyCustomError', (error) => Effect.succeed(`Got error: ${error.cause}`)),
  )

  console.log('Got result 2:', result2)

  // calling an Effect from an async function/promise
  const result3 = yield* $(Effect.promise(() => someAsyncFnRunningAnEffect()))

  console.log('Got result 3:', result3)
})

runMain(main.pipe(Effect.tapErrorCause(Effect.log)))
