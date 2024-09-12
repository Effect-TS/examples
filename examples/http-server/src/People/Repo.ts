import { Model } from "@effect/sql"
import { Cache, Context, Effect, Layer } from "effect"
import { Person, PersonId } from "../Domain/Person.js"
import { SqlLive } from "../Sql.js"

const make = Effect.gen(function* () {
  const repo = yield* Model.makeRepository(Person, {
    tableName: "people",
    spanPrefix: "PeopleRepo",
    idColumn: "id",
  })

  const findById = yield* Cache.make({
    lookup: repo.findById,
    capacity: 1024,
    timeToLive: 30_000,
  })

  return {
    ...repo,
    findById(id: PersonId) {
      return findById.get(id)
    },
  }
})

export class PeopleRepo extends Context.Tag("People/Repo")<
  PeopleRepo,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(PeopleRepo, make).pipe(Layer.provide(SqlLive))
}
