import * as SQLite from "@sqlfx/sqlite/Client"
import * as Effect from "effect/Effect"

export default Effect.flatMap(SQLite.tag, (sql) =>
  sql`
    CREATE UNIQUE INDEX document_chunks_content_hash_idx
    ON document_chunks (content_hash)
  `)
