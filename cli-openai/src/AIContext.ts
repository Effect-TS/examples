import * as Context from "effect/Context"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as String from "effect/String"
import TikToken from "tiktoken-node"
import type * as DocumentChunk from "./domain/DocumentChunk.js"
import * as DocumentChunkRepository from "./domain/DocumentChunkRepository.js"

const tokenizer = TikToken.encodingForModel("gpt-3.5-turbo")

const defaultPrefix =
  `Answer any questions in Markdown format, from the following document sections:
---`

export interface GenerateOptions {
  readonly prompt: string
  readonly targetTokens: number
  readonly maxTokens: number
  readonly prefix?: string
}

export class ContextTooLargeError extends Data.TaggedError("ContextTooLargeError")<{
  readonly requiredTokenCount: number
  readonly maxTokenCount: number
  readonly tokensToGenerate: number
}> {}

const make = Effect.gen(function*(_) {
  const repository = yield* _(DocumentChunkRepository.DocumentChunkRepository)

  const generate = ({
    maxTokens,
    prefix = defaultPrefix,
    prompt,
    targetTokens
  }: GenerateOptions) => {
    const requiredTokenCount = tokenizer.encode(`${prefix}\n\n${prompt}`).length
    const diffOrZero = Math.max(0, requiredTokenCount - (maxTokens - targetTokens))
    const tokensToGenerate = targetTokens - diffOrZero
    return repository.search(prompt).pipe(
      Effect.map((results) => {
        let tokens = 0
        const chunks: Array<DocumentChunk.DocumentChunk> = []

        for (const result of results) {
          const tokenCount = result.tokenCount

          if (tokens + tokenCount > tokensToGenerate) {
            break
          }

          tokens += tokenCount
          chunks.push(result)
        }

        const chunkContent = pipe(
          ReadonlyArray.map(chunks, (chunk) => String.trim(chunk.fullContent)),
          ReadonlyArray.join("\n\n--\n\n")
        )

        return {
          chunks,
          content: `${prefix}\n\n${chunkContent}`
        }
      }),
      Effect.filterOrFail(
        () => tokensToGenerate >= 1000,
        () =>
          new ContextTooLargeError({
            requiredTokenCount,
            maxTokenCount: maxTokens,
            tokensToGenerate
          })
      ),
      Effect.withSpan("AiContext.generate", { attributes: { prompt } })
    )
  }

  return { generate } as const
})

export class AIContext extends Context.Tag("@services/AIContext")<
  AIContext,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.effect(this, make).pipe(
    Layer.provide(DocumentChunkRepository.DocumentChunkRepository.Live)
  )
}
