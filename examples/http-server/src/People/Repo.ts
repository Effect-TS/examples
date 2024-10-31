import { Model } from "@effect/sql"
import { Effect } from "effect"
import { Person } from "../Domain/Person.js"
import { SqlLive } from "../Sql.js"

export class PeopleRepo extends Effect.Service<PeopleRepo>()("People/Repo", {
  effect: Model.makeRepository(Person, {
    tableName: "people",
    spanPrefix: "PeopleRepo",
    idColumn: "id"
  }),
  dependencies: [SqlLive]
}) {}
