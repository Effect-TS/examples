import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { flow, pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as String from "effect/String"
import type * as Document from "./domain/Document.js"
import * as DocumentChunk from "./domain/DocumentChunk.js"
import * as DocumentChunkRepository from "./domain/DocumentChunkRepository.js"

export const make = Effect.gen(function*(_) {
  const repository = yield* _(DocumentChunkRepository.DocumentChunkRepository)

  const chunkDocument = (document: Document.Document) =>
    pipe(
      splitTitle(document.content),
      ReadonlyArray.map((parsed) =>
        new DocumentChunk.ParsedDocumentChunk({
          path: document.path,
          ...parsed
        })
      ),
      Effect.forEach(
        (parsedChunk) => repository.upsert(parsedChunk.forInsert),
        { concurrency: "unbounded", batching: true }
      ),
      Effect.tap((chunks) =>
        repository.removeExtraneous(
          document.path,
          ReadonlyArray.map(chunks, (chunk) => chunk.contentHash)
        )
      ),
      Effect.annotateLogs("service", "DocumentChunker"),
      Effect.annotateLogs("method", "chunkDocument"),
      Effect.annotateLogs("path", document.path),
      Effect.withSpan("DocumentChunker.chunkDocument", { attributes: { path: document.path } })
    )

  return {
    chunkDocument
  } as const
})

export class DocumentChunker extends Context.Tag("@services/DocumentChunker")<
  DocumentChunker,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.effect(DocumentChunker, make).pipe(
    Layer.provide(DocumentChunkRepository.DocumentChunkRepository.Live)
  )
}

const splitTitle = (content: string) => {
  const chunks = content.split(/^#+\s+/m)

  if (chunks.length === 1) {
    return [
      {
        title: Option.none(),
        subtitle: Option.none(),
        content: chunks[0]
      }
    ]
  }

  return pipe(
    ReadonlyArray.drop(chunks, 1),
    ReadonlyArray.filterMap(nonEmptyString),
    ReadonlyArray.flatMap((content) => {
      const [title, ...rest] = String.split(content, "\n")
      content = String.trimStart(ReadonlyArray.join(rest, "\n"))
      return ReadonlyArray.map(splitSubtitle(content), (section) => ({
        title: Option.some(title),
        ...section
      }))
    })
  )
}

const splitSubtitle = (content: string) => {
  const chunks = content.split(/^##\s+/m)

  if (chunks.length === 1) {
    return [{
      subtitle: Option.none(),
      content: chunks[0]
    }]
  }

  return pipe(
    ReadonlyArray.filterMap(chunks, nonEmptyString),
    ReadonlyArray.map((content) => {
      const [subtitle, ...rest] = String.split(content, "\n")
      content = String.trimStart(ReadonlyArray.join(rest, "\n"))
      if (content === "") {
        return {
          subtitle: Option.none(),
          content: subtitle
        }
      }
      return {
        subtitle: nonEmptyString(subtitle),
        content
      } as const
    })
  )
}

const nonEmptyString = flow(
  String.trim,
  Option.liftPredicate(String.isNonEmpty)
)
