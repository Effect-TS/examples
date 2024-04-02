import * as ExperimentalRequestResolver from "@effect/experimental/RequestResolver"
import * as Schema from "@effect/schema/Schema"
import * as Context from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Request from "effect/Request"
import * as RequestResolver from "effect/RequestResolver"
import * as Schedule from "effect/Schedule"
import * as OpenAI from "./OpenAI.js"

export const FromSql = Schema.Uint8ArrayFromSelf.pipe(
  Schema.transform(
    Schema.instanceOf(Float32Array),
    (_) => new Float32Array(_.buffer, _.byteOffset, _.byteLength / 4),
    (_) => new Uint8Array(_.buffer, _.byteOffset, _.byteLength)
  )
)

const retryPolicy = Schedule.fixed(Duration.millis(100)).pipe(
  Schedule.compose(Schedule.recurs(3))
)

const make = Effect.gen(function*(_) {
  const openai = yield* _(OpenAI.OpenAI)
  const cache = yield* _(Request.makeCache({ capacity: 5000, timeToLive: "1 days" }))

  interface EmbeddingRequest extends Request.Request<Float32Array, OpenAI.OpenAIError> {
    readonly _tag: "EmbeddingRequest"
    readonly input: string
  }
  const EmbeddingRequest = Request.tagged<EmbeddingRequest>("EmbeddingRequest")

  const createEmbedding = (input: ReadonlyArray<EmbeddingRequest>) =>
    openai.call((_) =>
      _.embeddings.create({
        model: "text-embedding-ada-002",
        input: input.map((request) => request.input)
      })
    ).pipe(
      Effect.map((response) => response.data),
      Effect.retry(retryPolicy),
      Effect.withSpan("Embeddings.createEmbedding")
    )

  const resolver = RequestResolver.makeBatched((requests: Array<EmbeddingRequest>) =>
    createEmbedding(requests).pipe(
      Effect.flatMap((results) =>
        Effect.forEach(
          results,
          ({ embedding, index }) => Request.succeed(requests[index], new Float32Array(embedding)),
          { discard: true }
        )
      ),
      Effect.catchAll((error) =>
        Effect.forEach(requests, (request) => Request.fail(request, error), {
          discard: true
        })
      )
    )
  )

  const resolverDelayed = yield* _(ExperimentalRequestResolver.dataLoader(
    resolver,
    { window: Duration.millis(500) }
  ))

  const single = (input: string) =>
    Effect.request(EmbeddingRequest({ input }), resolver).pipe(
      Effect.withRequestCache(cache),
      Effect.withRequestCaching(true),
      Effect.withSpan("Embeddings.single")
    )

  const batched = (input: string) =>
    Effect.request(EmbeddingRequest({ input }), resolverDelayed).pipe(
      Effect.withSpan("Embeddings.batched")
    )

  return { single, batched } as const
})

export class Embeddings extends Context.Tag("@services/Embeddings")<
  Embeddings,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.scoped(this, make)
}
