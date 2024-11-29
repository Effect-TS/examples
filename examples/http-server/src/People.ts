import { SqlClient } from "@effect/sql"
import { Effect, Option, pipe } from "effect"
import type { GroupId } from "./Domain/Group.js"
import type { PersonId } from "./Domain/Person.js"
import { Person, PersonNotFound } from "./Domain/Person.js"
import { policyRequire } from "./Domain/Policy.js"
import { PeopleRepo } from "./People/Repo.js"
import { SqlLive } from "./Sql.js"

export class People extends Effect.Service<People>()("People", {
  effect: Effect.gen(function*() {
    const repo = yield* PeopleRepo
    const sql = yield* SqlClient.SqlClient

    const create = (groupId: GroupId, person: typeof Person.jsonCreate.Type) =>
      pipe(
        repo.insert(
          Person.insert.make({
            ...person,
            groupId
          })
        ),
        Effect.withSpan("People.create", { attributes: { person, groupId } }),
        policyRequire("Person", "create")
      )

    const findById = (id: PersonId) =>
      pipe(
        repo.findById(id),
        Effect.withSpan("People.findById", { attributes: { id } }),
        policyRequire("Person", "read")
      )

    const with_ = <B, E, R>(
      id: PersonId,
      f: (person: Person) => Effect.Effect<B, E, R>
    ): Effect.Effect<B, E | PersonNotFound, R> =>
      pipe(
        repo.findById(id),
        Effect.flatMap(
          Option.match({
            onNone: () => Effect.fail(new PersonNotFound({ id })),
            onSome: Effect.succeed
          })
        ),
        Effect.flatMap(f),
        sql.withTransaction,
        Effect.catchTag("SqlError", (e) => Effect.die(e)),
        Effect.withSpan("People.with", { attributes: { id } })
      )

    return { create, findById, with: with_ } as const
  }),
  dependencies: [SqlLive, PeopleRepo.Default]
}) {}
