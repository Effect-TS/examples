import * as Cache from "effect/Cache"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Stream from "effect/Stream"
import * as AIContext from "./AIContext.js"
import type * as CompletionRequest from "./domain/CompletionRequest.js"
import * as OpenAI from "./OpenAI.js"

export const make = Effect.gen(function*(_) {
  const aiContext = yield* _(AIContext.AIContext)
  const openai = yield* _(OpenAI.OpenAI)

  const cache = yield* _(Cache.make({
    lookup: (_query: string) => Effect.succeedNone as Effect.Effect<Option.Option<string>>,
    capacity: 10000,
    timeToLive: "3 days"
  }))

  const create = (request: CompletionRequest.CompletionRequest) =>
    Effect.gen(function*(_) {
      if (request.input.length === 1) {
        const cached = yield* _(cache.get(request.input[0].content))
        if (Option.isSome(cached)) {
          return Stream.make(cached.value)
        }
      }

      const { content } = yield* _(
        aiContext.generate({
          prompt: request.userMessages.join("\n\n"),
          targetTokens: request.contextTokens.target,
          maxTokens: request.contextTokens.max
        })
      )

      const chunks: Array<string> = []

      let stream = openai.completion({
        system: content,
        messages: request.input,
        model: request.model,
        maxTokens: request.responseTokens
      })

      if (request.input.length === 1) {
        stream = stream.pipe(
          Stream.tap((_) => Effect.sync(() => chunks.push(_))),
          Stream.onDone(() => cache.set(request.input[0].content, Option.some(chunks.join(""))))
        )
      }

      return stream
    }).pipe(
      Stream.unwrap,
      Stream.withSpan("Completions.create", {
        attributes: {
          input: pipe(
            ReadonlyArray.last(request.input),
            Option.map((_) => _.content),
            Option.getOrElse(() => "")
          )
        }
      })
    )

  const context = (request: CompletionRequest.CompletionRequest) =>
    pipe(
      aiContext.generate({
        prompt: request.userMessages.join("\n\n"),
        targetTokens: request.contextTokens.target,
        maxTokens: request.contextTokens.max
      }),
      Effect.map(({ content }) => content),
      Effect.withSpan("Completions.context", {
        attributes: {
          input: pipe(
            ReadonlyArray.last(request.input),
            Option.map((_) => _.content),
            Option.getOrElse(() => "")
          )
        }
      })
    )

  return {
    create,
    context
  }
})

export class Completions extends Context.Tag("@services/Completions")<
  Completions,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.effect(this, make).pipe(
    Layer.provide(AIContext.AIContext.Live)
  )
}
