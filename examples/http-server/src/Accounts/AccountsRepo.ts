import { Model } from "@effect/sql"
import type { Effect } from "effect"
import { Context, Layer } from "effect"
import { Account } from "../Domain/Account.js"
import { makeTestLayer } from "../lib/Layer.js"
import { SqlLive } from "../Sql.js"

export const make = Model.makeRepository(Account, {
  tableName: "accounts",
  spanPrefix: "AccountsRepo",
  idColumn: "id"
})

export class AccountsRepo extends Context.Tag("Accounts/AccountsRepo")<
  AccountsRepo,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(AccountsRepo, make).pipe(Layer.provide(SqlLive))
  static Test = makeTestLayer(AccountsRepo)({})
}
