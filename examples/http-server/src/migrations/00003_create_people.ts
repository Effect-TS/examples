import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql.onDialectOrElse({
    pg: () =>
      sql`
      CREATE TABLE people (
        id SERIAL PRIMARY KEY,
        groupId INTEGER NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        dateOfBirth DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES groups(id)
      )
    `,
    orElse: () =>
      sql`
      CREATE TABLE people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupId INTEGER NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        dateOfBirth DATE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (groupId) REFERENCES groups(id)
      )
    `
  })
})
