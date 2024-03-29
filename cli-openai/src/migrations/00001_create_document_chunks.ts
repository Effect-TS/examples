import * as SQLite from "@sqlfx/sqlite/Client"
import * as Effect from "effect/Effect"

export default Effect.flatMap(SQLite.tag, (sql) =>
  sql`
    CREATE TABLE document_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      path TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      content TEXT NOT NULL,
      content_hash INTEGER NOT NULL,
      token_count INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
