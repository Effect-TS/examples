import { Effect, Layer, Option, pipe } from "effect"
import { PeopleRepo } from "./People/Repo.js"
import { Person, PersonId, PersonNotFound } from "./Domain/Person.js"
import { policyRequire } from "./Domain/Policy.js"
import { GroupId } from "./Domain/Group.js"
import { SqlClient, SqlError } from "@effect/sql"
import { SqlLive } from "./Sql.js"

const make = Effect.gen(function* () {
  const repo = yield* PeopleRepo
  const sql = yield* SqlClient.SqlClient

  const create = (groupId: GroupId, person: typeof Person.jsonCreate.Type) =>
    pipe(
      repo.insert(
        Person.insert.make({
          ...person,
          groupId,
        }),
      ),
      Effect.withSpan("People.create", { attributes: { person, groupId } }),
      policyRequire("Person", "create"),
    )

  const findById = (id: PersonId) =>
    pipe(
      repo.findById(id),
      Effect.withSpan("People.findById", { attributes: { id } }),
      policyRequire("Person", "read"),
    )

  const with_ = <B, E, R>(
    id: PersonId,
    f: (person: Person) => Effect.Effect<B, E, R>,
  ): Effect.Effect<B, E | PersonNotFound, R> =>
    pipe(
      repo.findById(id),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new PersonNotFound({ id })),
          onSome: Effect.succeed,
        }),
      ),
      Effect.flatMap(f),
      sql.withTransaction,
      Effect.catchTag("SqlError", (e) => Effect.die(e)),
      Effect.withSpan("People.with", { attributes: { id } }),
    )

  return { create, findById, with: with_ } as const
})

export class People extends Effect.Tag("People")<
  People,
  Effect.Effect.Success<typeof make>
>() {
  static layer = Layer.effect(People, make)
  static Live = this.layer.pipe(
    Layer.provide(PeopleRepo.Live),
    Layer.provide(SqlLive),
  )
}
