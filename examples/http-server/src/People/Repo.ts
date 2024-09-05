import { Model } from "@effect/sql"
import type { Effect } from "effect"
import { Context, Layer } from "effect"
import { Person } from "../Domain/Person.js"
import { SqlLive } from "../Sql.js"

const make = Model.makeRepository(Person, {
  tableName: "people",
  spanPrefix: "PeopleRepo",
  idColumn: "id"
})

export class PeopleRepo extends Context.Tag("People/Repo")<
  PeopleRepo,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(PeopleRepo, make).pipe(Layer.provide(SqlLive))
}
