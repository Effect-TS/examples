import * as Config from "effect/Config"
import * as Context from "effect/Context"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Secret from "effect/Secret"
import * as Stream from "effect/Stream"
import { OpenAI as OpenAIApi } from "openai"
import * as RateLimiter from "./RateLimiter.js"

export class OpenAIError extends Data.TaggedError("OpenAIError")<{
  readonly error: unknown
}> {}

export interface OpenAIOptions {
  readonly apiKey: Secret.Secret
  readonly organization: Option.Option<Secret.Secret>
}

const handleError = (error: unknown) =>
  new OpenAIError({
    error: (error as any).error?.message ?? error
  })

const make = (options: OpenAIOptions) =>
  Effect.gen(function*(_) {
    // For now, we just create a simple rate limiter to enforce the 5000 request
    // per minute rate limit we have with OpenAI. However, the rate limiter
    // factory is flexible enough to allow us to create separate rate limiters
    // for different use cases.
    const rateLimiter = yield* _(RateLimiter.make(5000, "1 minutes"))

    const client = yield* _(Effect.sync(() =>
      new OpenAIApi({
        apiKey: Secret.value(options.apiKey),
        organization: options.organization.pipe(
          Option.map(Secret.value),
          Option.getOrNull
        )
      })
    ))

    const call = <A>(f: (api: OpenAIApi, signal: AbortSignal) => Promise<A>) =>
      rateLimiter.take.pipe(
        Effect.zipRight(Effect.tryPromise({
          try: (signal) => f(client, signal),
          catch: handleError
        })),
        Effect.withSpan("OpenAI.call")
      )

    const completion = (options: {
      readonly model: string
      readonly system: string
      readonly maxTokens: number
      readonly messages: ReadonlyArray<OpenAIApi.Chat.ChatCompletionMessageParam>
    }) =>
      call((_, signal) =>
        _.chat.completions.create(
          {
            model: options.model,
            temperature: 0.1,
            max_tokens: options.maxTokens,
            messages: [
              {
                role: "system",
                content: options.system
              },
              ...options.messages
            ],
            stream: true
          },
          { signal }
        )
      ).pipe(
        Effect.map((stream) => Stream.fromAsyncIterable(stream, handleError)),
        Stream.unwrap,
        Stream.filterMap((chunk) => Option.fromNullable(chunk.choices[0].delta.content))
      )

    return {
      client,
      call,
      completion
    }
  })

export class OpenAI extends Context.Tag("@services/OpenAI")<
  OpenAI,
  Effect.Effect.Success<ReturnType<typeof make>>
>() {
  static readonly Live = (config: Config.Config.Wrap<OpenAIOptions>) =>
    Layer.scoped(OpenAI, Config.unwrap(config).pipe(Effect.flatMap(make))).pipe(
      Layer.provide(RateLimiter.FactoryLive)
    )
}
