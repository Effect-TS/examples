import { NodeContext } from "@effect/platform-node"
import { SqlClient } from "@effect/sql"
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node"
import { identity, Layer } from "effect"
import { fileURLToPath } from "url"
import { makeTestLayer } from "./lib/Layer.js"

const ClientLive = SqliteClient.layer({
  filename: "data/db.sqlite"
})

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(
    fileURLToPath(new URL("./migrations", import.meta.url))
  )
}).pipe(Layer.provide(NodeContext.layer))

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(ClientLive))

export const SqlTest = makeTestLayer(SqlClient.SqlClient)({
  withTransaction: identity
})
