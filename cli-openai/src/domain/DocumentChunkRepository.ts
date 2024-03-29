import * as ExperimentalRequestResolver from "@effect/experimental/RequestResolver"
import { TreeFormatter } from "@effect/schema"
import * as Schema from "@effect/schema/Schema"
import * as SQLite from "@sqlfx/sqlite/Client"
import type * as SqlError from "@sqlfx/sqlite/Error"
import * as Context from "effect/Context"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { flow } from "effect/Function"
import * as Inspectable from "effect/Inspectable"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Embedding from "../Embeddings.js"
import type * as OpenAI from "../OpenAI.js"
import * as DocumentChunk from "./DocumentChunk.js"

export class DocumentChunkRepositoryError extends Data.TaggedError("DocumentChunkRepositoryError")<{
  readonly method: string
  readonly error:
    | SqlError.SqlError
    | SqlError.SchemaError
    | OpenAI.OpenAIError
    | SqlError.ResultLengthMismatch
}> {
  get message() {
    const message = Predicate.isTagged(this.error, "SchemaError")
      ? TreeFormatter.formatIssue(this.error.error)
      : Predicate.isTagged(this.error, "OpenAIError")
      ? Inspectable.format(this.error.error)
      : "message" in this.error
      ? this.error.message
      : Inspectable.format(this.error)
    return `${this.method} failed: ${message}`
  }
}

export const DocumentChunkForInsert = DocumentChunk.DocumentChunk.struct.pipe(
  Schema.omit("id", "createdAt", "updatedAt")
)
export type ChunkForInsert = Schema.Schema.To<typeof DocumentChunkForInsert>

const make = Effect.gen(function*(_) {
  const embedding = yield* _(Embedding.Embeddings)
  const sql = yield* _(SQLite.tag)

  const getEmbeddings = flow(
    sql.schemaSingleOption(
      Schema.number,
      Embedding.FromSql,
      (id) =>
        sql<{ embedding: Uint8Array }>`
          SELECT rowid, embedding
          FROM vss_chunks
          WHERE rowid = ${id}
        `.pipe(Effect.map(ReadonlyArray.map(({ embedding }) => embedding)))
    ),
    Effect.withSpan("DocumentChunkRepository.getEmbeddings")
  )

  const setEmbeddings = flow(
    sql.schemaVoid(
      Schema.struct({
        id: Schema.number,
        embeddings: Embedding.FromSql
      }),
      ({ embeddings, id }) =>
        sql`INSERT INTO vss_chunks(rowid, embedding)
          VALUES (${id}, ${embeddings})`
    ),
    Effect.withSpan("DocumentChunkRepository.setEmbeddings")
  )

  const Upsert = sql.resolver("UpsertDocumentChunk", {
    request: DocumentChunkForInsert,
    result: DocumentChunk.DocumentChunk,
    run: (chunk) =>
      sql<any>`INSERT INTO document_chunks ${sql.insert(chunk)}
          ON CONFLICT (content_hash) DO UPDATE
          SET content_hash = EXCLUDED.content_hash
          RETURNING *`
  })

  const upsertResolver = yield* _(ExperimentalRequestResolver.dataLoader(
    Upsert.Resolver,
    { window: "500 millis" }
  ))

  const upsertDebounced = Upsert.makeExecute(upsertResolver)

  const upsert = (chunk: ChunkForInsert) =>
    upsertDebounced(chunk).pipe(
      Effect.bindTo("chunk"),
      Effect.bind("embeddings", ({ chunk }) => getEmbeddings(chunk.id)),
      Effect.flatMap(({ chunk, embeddings }) => {
        return Option.match(embeddings, {
          onNone: () =>
            Effect.log("Generating embeddings").pipe(
              Effect.zipRight(embedding.batched(chunk.fullContent)),
              Effect.flatMap((embeddings) => setEmbeddings({ id: chunk.id, embeddings })),
              Effect.as(chunk),
              Effect.annotateLogs("chunkId", chunk.id.toString())
            ),
          onSome: () => Effect.succeed(chunk)
        })
      }),
      Effect.mapError((error) => new DocumentChunkRepositoryError({ method: "upsert", error })),
      Effect.withSpan("DocumentChunkRepository.upsert", {
        attributes: {
          path: chunk.path,
          title: Option.getOrElse(chunk.title, () => "")
        }
      })
    )

  const removeExtraneous = (path: string, hashes: ReadonlyArray<number>) =>
    sql`
      DELETE FROM document_chunks
      WHERE path = ${path} AND content_hash NOT IN ${sql(hashes)}
    `.pipe(
      Effect.mapError(
        (error) => new DocumentChunkRepositoryError({ method: "removeExtranous", error })
      ),
      Effect.asUnit,
      Effect.withSpan("DocumentChunkRepository.removeExtraneous")
    )

  const searchByEmbedding = flow(
    sql.schema(
      Schema.struct({
        embedding: Embedding.FromSql,
        limit: Schema.optional(Schema.number)
      }),
      DocumentChunk.DocumentChunk,
      ({ embedding, limit = 35 }) =>
        sql`
          WITH matches AS (
            SELECT rowid, distance
            FROM vss_chunks
            WHERE vss_search(embedding, ${embedding})
            ORDER BY distance ASC
            LIMIT ${limit}
          )
          SELECT document_chunks.*, matches.distance
          FROM matches
          LEFT join document_chunks on document_chunks.id = matches.rowid
        `
    ),
    Effect.withSpan("DocumentChunkRepository.searchByEmbedding")
  )

  const search = (query: string, limit?: number) =>
    embedding.single(query).pipe(
      Effect.flatMap((embedding) => searchByEmbedding({ embedding, limit })),
      Effect.withSpan("DocumentChunkRepository.search", { attributes: { query, limit } })
    )

  return {
    removeExtraneous,
    getEmbeddings,
    setEmbeddings,
    upsert,
    search
  } as const
})

export class DocumentChunkRepository extends Context.Tag("@services/DocumentChunkRepository")<
  DocumentChunkRepository,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.provide(
    Layer.scoped(this, make),
    Embedding.Embeddings.Live
  )
}
