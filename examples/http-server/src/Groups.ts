import { SqlClient } from "@effect/sql"
import { Effect, Option, pipe } from "effect"
import type { AccountId } from "./Domain/Account.js"
import type { GroupId } from "./Domain/Group.js"
import { Group, GroupNotFound } from "./Domain/Group.js"
import { policyRequire } from "./Domain/Policy.js"
import { GroupsRepo } from "./Groups/Repo.js"
import { SqlLive } from "./Sql.js"

export class Groups extends Effect.Service<Groups>()("Groups", {
  effect: Effect.gen(function*() {
    const repo = yield* GroupsRepo
    const sql = yield* SqlClient.SqlClient

    const create = (ownerId: AccountId, group: typeof Group.jsonCreate.Type) =>
      pipe(
        repo.insert(
          Group.insert.make({
            ...group,
            ownerId
          })
        ),
        Effect.withSpan("Groups.create", { attributes: { group } }),
        policyRequire("Group", "create")
      )

    const update = (
      group: Group,
      update: Partial<typeof Group.jsonUpdate.Type>
    ) =>
      pipe(
        repo.update({
          ...group,
          ...update,
          updatedAt: undefined
        }),
        Effect.withSpan("Groups.update", {
          attributes: { id: group.id, update }
        }),
        policyRequire("Group", "update")
      )

    const findById = (id: GroupId) =>
      pipe(
        repo.findById(id),
        Effect.withSpan("Groups.findById", { attributes: { id } }),
        policyRequire("Group", "read")
      )

    const with_ = <A, E, R>(
      id: GroupId,
      f: (group: Group) => Effect.Effect<A, E, R>
    ): Effect.Effect<A, E | GroupNotFound, R> =>
      pipe(
        repo.findById(id),
        Effect.flatMap(
          Option.match({
            onNone: () => new GroupNotFound({ id }),
            onSome: Effect.succeed
          })
        ),
        Effect.flatMap(f),
        sql.withTransaction,
        Effect.catchTag("SqlError", (err) => Effect.die(err)),
        Effect.withSpan("Groups.with", { attributes: { id } })
      )

    return { create, update, findById, with: with_ } as const
  }),
  dependencies: [SqlLive, GroupsRepo.Default]
}) {}
